import {
  Controller,
  Get,
  Logger,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

// Shape of the request user produced by JwtStrategy.validate (minimal claims).
type CurrentUser = {
  id: string;
  sub: string;
  email: string;
  role: UserRole;
  name: string;
};
import { v4 as uuidv4 } from 'uuid';

@ApiTags('chats')
@ApiBearerAuth()
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  private readonly logger = new Logger(ChatsController.name);

  constructor(private readonly chatsService: ChatsService) {}

  // ---------------------------------------------------------------------------
  // Admin maintenance endpoints. Declared FIRST so they are matched before the
  // dynamic ":id" / ":recipientId" routes below. Restricted to UserRole.ADMIN
  // and excluded from the public Swagger document.
  // ---------------------------------------------------------------------------

  @Get('admin/debug-messages/:chatId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Maintenance (admin only): raw messages for a chat',
  })
  async debugMessages(@Param('chatId') chatId: string): Promise<any> {
    const connection =
      this.chatsService['messagesRepository'].manager.connection;
    const result = await connection.query(
      `
      SELECT m.*, c.id as chat_id
      FROM message m
      LEFT JOIN chat c ON m."chatId" = c.id
      WHERE m."chatId" = $1
    `,
      [chatId],
    );

    return {
      rawMessages: result,
      messageCount: result.length,
    };
  }

  @Post('admin/fix-messages')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Maintenance (admin only): fix messages with missing chatId',
  })
  async fixMessages(): Promise<any> {
    const connection =
      this.chatsService['messagesRepository'].manager.connection;

    const chats = await connection.query(
      `SELECT id, "senderId", "recipientId" FROM chat`,
    );
    const messagesWithNullChat = await connection.query(
      `SELECT id, "senderId", "recipientId" FROM message WHERE "chatId" IS NULL`,
    );

    let fixedCount = 0;
    for (const message of messagesWithNullChat) {
      const matchingChat = chats.find(
        (chat) =>
          (chat.senderId === message.senderId &&
            chat.recipientId === message.recipientId) ||
          (chat.senderId === message.recipientId &&
            chat.recipientId === message.senderId),
      );

      if (matchingChat) {
        await connection.query(
          `UPDATE message SET "chatId" = $1 WHERE id = $2`,
          [matchingChat.id, message.id],
        );
        fixedCount++;
      }
    }

    return {
      total: messagesWithNullChat.length,
      fixed: fixedCount,
      remaining: messagesWithNullChat.length - fixedCount,
    };
  }

  @Get('admin/fix-messages/sql')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Maintenance (admin only): SQL recipe to fix chatId',
  })
  async getFixMessagesSql(): Promise<any> {
    const connection =
      this.chatsService['messagesRepository'].manager.connection;
    const chats = await connection.query(
      `SELECT id, "senderId", "recipientId" FROM chat LIMIT 10`,
    );

    return {
      sql: `
-- SQL to fix messages with missing chatId
SELECT id, content, "senderId", "recipientId", "chatId"
FROM message
WHERE "chatId" IS NULL;

UPDATE message m
SET "chatId" = c.id
FROM chat c
WHERE m."chatId" IS NULL
AND (
  (m."senderId" = c."senderId" AND m."recipientId" = c."recipientId")
  OR
  (m."senderId" = c."recipientId" AND m."recipientId" = c."senderId")
);

SELECT COUNT(*) FROM message WHERE "chatId" IS NULL;
      `,
      note: 'Run this SQL directly in your database to fix message chatId values.',
      exampleChats: chats,
    };
  }

  @Post('admin/messages/:chatId/direct')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Maintenance (admin only): direct SQL message insert',
  })
  async addMessageDirect(
    @Param('chatId') chatId: string,
    @Body() createMessageDto: { content: string },
    @Req() req: any,
  ): Promise<any> {
    try {
      const userId = req.user.id;
      const chat = await this.chatsService.findOne(chatId, userId);
      const recipientId =
        chat.sender.id === userId ? chat.recipient.id : chat.sender.id;

      const connection =
        this.chatsService['messagesRepository'].manager.connection;
      const result = await connection.query(
        `INSERT INTO message (id, content, "senderId", "recipientId", "chatId", "isRead", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, content, "createdAt"`,
        [
          uuidv4(),
          createMessageDto.content,
          userId,
          recipientId,
          chatId,
          false,
          new Date(),
        ],
      );

      if (chat.sender.id === userId) {
        chat.unreadCount += 1;
        await this.chatsService['chatsRepository'].save(chat);
      }

      const messageData = await connection.query(
        `SELECT m.*,
                s.id as "senderId", s.name as "senderName",
                r.id as "recipientId", r.name as "recipientName"
         FROM message m
         LEFT JOIN "users" s ON m."senderId" = s.id
         LEFT JOIN "users" r ON m."recipientId" = r.id
         WHERE m.id = $1`,
        [result[0].id],
      );

      const message = {
        id: messageData[0].id,
        content: messageData[0].content,
        sender: {
          id: messageData[0].senderId,
          name: messageData[0].senderName,
        },
        recipient: {
          id: messageData[0].recipientId,
          name: messageData[0].recipientName,
        },
        chat: { id: chatId },
        chatId,
        senderId: messageData[0].senderId,
        recipientId: messageData[0].recipientId,
        isRead: messageData[0].isRead,
        createdAt: messageData[0].createdAt,
      } as any;

      if (this.chatsService['chatsGateway']) {
        this.chatsService['chatsGateway'].emitNewMessage(message, chat);
      }

      return message;
    } catch (error) {
      this.logger.error(
        `Error in direct message creation: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Failed to create message: ' + (error as Error).message,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Public chat API (any authenticated user).
  // ---------------------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'Get all chats for the current user' })
  @ApiResponse({ status: 200, description: 'Return all chats.', type: [Chat] })
  findAll(@GetCurrentUser() user: CurrentUser): Promise<Chat[]> {
    return this.chatsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chat by id' })
  @ApiResponse({ status: 200, description: 'Return the chat.', type: Chat })
  @ApiResponse({ status: 404, description: 'Chat not found.' })
  findOne(
    @Param('id') id: string,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<Chat> {
    return this.chatsService.findOne(id, user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get all messages for a chat' })
  @ApiResponse({
    status: 200,
    description: 'Return all messages.',
    type: [Message],
  })
  getMessages(
    @Param('id') id: string,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<Message[]> {
    return this.chatsService.getMessages(id, user.id);
  }

  @Post(':recipientId')
  @ApiOperation({ summary: 'Create a new chat or return existing one' })
  @ApiResponse({ status: 201, description: 'Chat created successfully.' })
  create(
    @Param('recipientId') recipientId: string,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<Chat> {
    return this.chatsService.create(user.id, recipientId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to a chat' })
  @ApiResponse({ status: 201, description: 'Message added successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid message content.' })
  async addMessage(
    @Param('id') id: string,
    @Body('content') content: string,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<Message> {
    if (!content || content.trim() === '') {
      throw new BadRequestException('Message content cannot be empty');
    }
    return this.chatsService.addMessage(id, user.id, content);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark chat as read' })
  @ApiResponse({ status: 200, description: 'Chat marked as read.' })
  async markAsRead(
    @Param('id') id: string,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<{ success: boolean }> {
    await this.chatsService.markAsRead(id, user.id);
    return { success: true };
  }
}

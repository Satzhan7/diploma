import { Controller, Get, Post, Body, Param, UseGuards, Req, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('chats')
@ApiBearerAuth()
@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all chats for the current user' })
  @ApiResponse({ status: 200, description: 'Return all chats.', type: [Chat] })
  findAll(@GetUser() user: User): Promise<Chat[]> {
    return this.chatsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chat by id' })
  @ApiResponse({ status: 200, description: 'Return the chat.', type: Chat })
  @ApiResponse({ status: 404, description: 'Chat not found.' })
  findOne(@Param('id') id: string, @GetUser() user: User): Promise<Chat> {
    return this.chatsService.findOne(id, user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get all messages for a chat' })
  @ApiResponse({ status: 200, description: 'Return all messages.', type: [Message] })
  getMessages(@Param('id') id: string, @GetUser() user: User): Promise<Message[]> {
    return this.chatsService.getMessages(id, user.id);
  }

  @Post(':recipientId')
  @ApiOperation({ summary: 'Create a new chat or return existing one' })
  @ApiResponse({ status: 201, description: 'Chat created successfully.' })
  create(
    @Param('recipientId') recipientId: string,
    @GetUser() user: User,
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
    @GetUser() user: User,
  ): Promise<Message> {
    if (!content || content.trim() === '') {
      throw new Error('Message content cannot be empty');
    }
    return this.chatsService.addMessage(id, user.id, content);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark chat as read' })
  @ApiResponse({ status: 200, description: 'Chat marked as read.' })
  async markAsRead(@Param('id') id: string, @GetUser() user: User): Promise<{ success: boolean }> {
    await this.chatsService.markAsRead(id, user.id);
    return { success: true };
  }

  @Get('debug/messages/:chatId')
  @ApiOperation({ summary: 'Debug: Get raw messages for a chat' })
  async debugMessages(@Param('id') chatId: string): Promise<any> {
    // This is for debugging only
    const connection = this.chatsService['messagesRepository'].manager.connection;
    const result = await connection.query(`
      SELECT m.*, c.id as chat_id 
      FROM message m 
      LEFT JOIN chat c ON m."chatId" = c.id 
      WHERE m."chatId" = $1
    `, [chatId]);
    
    return {
      rawMessages: result,
      messageCount: result.length
    };
  }

  @Post('fix-messages')
  @ApiOperation({ summary: 'Fix messages with missing chatId' })
  async fixMessages(): Promise<any> {
    const connection = this.chatsService['messagesRepository'].manager.connection;
    
    // First, get all chats
    const chats = await connection.query(`SELECT id, "senderId", "recipientId" FROM chat`);
    
    // Then get all messages with NULL chatId
    const messagesWithNullChat = await connection.query(`SELECT id, "senderId", "recipientId" FROM message WHERE "chatId" IS NULL`);
    
    console.log(`Found ${messagesWithNullChat.length} messages with null chatId`);
    
    let fixedCount = 0;
    
    // For each message, find a matching chat and update the message
    for (const message of messagesWithNullChat) {
      // Find a chat that matches this message's sender and recipient
      const matchingChat = chats.find(chat => 
        (chat.senderId === message.senderId && chat.recipientId === message.recipientId) ||
        (chat.senderId === message.recipientId && chat.recipientId === message.senderId)
      );
      
      if (matchingChat) {
        // Update the message with the found chatId
        await connection.query(
          `UPDATE message SET "chatId" = $1 WHERE id = $2`,
          [matchingChat.id, message.id]
        );
        fixedCount++;
      }
    }
    
    // Return the results
    return {
      total: messagesWithNullChat.length,
      fixed: fixedCount,
      remaining: messagesWithNullChat.length - fixedCount
    };
  }

  @Get('fix-messages/sql')
  @ApiOperation({ summary: 'Get SQL to fix messages with missing chatId' })
  async getFixMessagesSql(): Promise<any> {
    // Get list of chats for the user to reference
    const connection = this.chatsService['messagesRepository'].manager.connection;
    const chats = await connection.query(`SELECT id, "senderId", "recipientId" FROM chat LIMIT 10`);
    
    return {
      sql: `
-- SQL to fix messages with missing chatId
-- Step 1: Find messages without chatId
SELECT id, content, "senderId", "recipientId", "chatId" 
FROM message 
WHERE "chatId" IS NULL;

-- Step 2: Update messages based on sender/recipient matching
UPDATE message m
SET "chatId" = c.id
FROM chat c
WHERE m."chatId" IS NULL
AND (
  (m."senderId" = c."senderId" AND m."recipientId" = c."recipientId")
  OR 
  (m."senderId" = c."recipientId" AND m."recipientId" = c."senderId")
);

-- Step 3: Verify if any messages still have NULL chatId
SELECT COUNT(*) FROM message WHERE "chatId" IS NULL;
      `,
      note: 'Run this SQL directly in your database to fix message chatId values.',
      exampleChats: chats
    };
  }

  @Post(':id/messages/direct')
  @ApiOperation({ summary: 'Add a message to a chat using direct SQL (debug fix)' })
  @UseGuards(JwtAuthGuard)
  async addMessageDirect(
    @Param('id') chatId: string,
    @Body() createMessageDto: { content: string },
    @Req() req,
  ) {
    try {
      // Get user from request
      const userId = req.user.id;
      
      // Validate chat exists and user has access
      const chat = await this.chatsService.findOne(chatId, userId);
      
      // Determine recipient
      const recipientId = chat.sender.id === userId ? chat.recipient.id : chat.sender.id;
      
      // Use direct SQL to add message
      const connection = this.chatsService['messagesRepository'].manager.connection;
      const result = await connection.query(
        `INSERT INTO message (id, content, "senderId", "recipientId", "chatId", "isRead", "createdAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, content, "createdAt"`,
        [
          uuidv4(),           // $1: id
          createMessageDto.content, // $2: content
          userId,             // $3: senderId
          recipientId,        // $4: recipientId
          chatId,             // $5: chatId
          false,              // $6: isRead
          new Date()          // $7: createdAt
        ]
      );
      
      // Update chat unread count
      if (chat.sender.id === userId) {
        chat.unreadCount += 1;
        await this.chatsService['chatsRepository'].save(chat);
      }
      
      // Fetch the message data
      const messageData = await connection.query(
        `SELECT m.*, 
                s.id as "senderId", s.name as "senderName", 
                r.id as "recipientId", r.name as "recipientName"
         FROM message m
         LEFT JOIN "users" s ON m."senderId" = s.id
         LEFT JOIN "users" r ON m."recipientId" = r.id
         WHERE m.id = $1`,
        [result[0].id]
      );
      
      // Create message object
      const message = {
        id: messageData[0].id,
        content: messageData[0].content,
        sender: { 
          id: messageData[0].senderId,
          name: messageData[0].senderName
        },
        recipient: {
          id: messageData[0].recipientId,
          name: messageData[0].recipientName
        },
        chat: { id: chatId },
        chatId: chatId,
        senderId: messageData[0].senderId,
        recipientId: messageData[0].recipientId,
        isRead: messageData[0].isRead,
        createdAt: messageData[0].createdAt
      } as any;
      
      // Emit the message via websocket
      if (this.chatsService['chatsGateway']) {
        this.chatsService['chatsGateway'].emitNewMessage(message, chat);
      }
      
      return message;
    } catch (error) {
      console.error('Error in direct message creation:', error);
      throw new InternalServerErrorException('Failed to create message: ' + error.message);
    }
  }
} 
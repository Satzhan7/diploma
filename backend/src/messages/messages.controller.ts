import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all messages' })
  @ApiResponse({ status: 200, description: 'Return all messages.', type: [Message] })
  findAll(): Promise<Message[]> {
    return this.messagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by id' })
  @ApiResponse({ status: 200, description: 'Return the message.', type: Message })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  findOne(@Param('id') id: string): Promise<Message> {
    return this.messagesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({ status: 201, description: 'The message has been successfully created.', type: Message })
  create(@Body() message: Partial<Message>): Promise<Message> {
    return this.messagesService.create(message);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, description: 'The message has been successfully updated.', type: Message })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  update(@Param('id') id: string, @Body() message: Partial<Message>): Promise<Message> {
    return this.messagesService.update(id, message);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'The message has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.messagesService.remove(id);
  }
} 
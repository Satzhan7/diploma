/**
 * Migration script to add recipient to existing messages
 * 
 * Run this script with:
 * npx ts-node -r tsconfig-paths/register src/scripts/add-recipient-to-messages.ts
 */

import { createConnection, getRepository } from 'typeorm';
import { Chat } from '../chats/entities/chat.entity';
import { Message } from '../chats/entities/message.entity';

async function migrate() {
  console.log('Starting migration: Adding recipient to messages...');
  
  try {
    const connection = await createConnection();
    console.log('Database connection established');
    
    const chatRepository = getRepository(Chat);
    const messageRepository = getRepository(Message);
    
    // Get all chats with their messages
    const chats = await chatRepository.find({
      relations: ['sender', 'recipient', 'messages'],
    });
    
    console.log(`Found ${chats.length} chats to process`);
    
    for (const chat of chats) {
      console.log(`Processing chat ${chat.id} with ${chat.messages?.length || 0} messages`);
      
      if (!chat.messages || chat.messages.length === 0) {
        continue;
      }
      
      // For each message, update the recipient
      for (const message of chat.messages) {
        console.log(`Updating message ${message.id}`);
        
        // Determine the recipient based on sender
        const recipientId = message.sender.id === chat.sender.id
          ? chat.recipient.id
          : chat.sender.id;
        
        // Update the message with the recipient
        await messageRepository.update(
          { id: message.id },
          { recipient: { id: recipientId } }
        );
      }
    }
    
    console.log('Migration completed successfully');
    await connection.close();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in migration script:', error);
    process.exit(1);
  }); 
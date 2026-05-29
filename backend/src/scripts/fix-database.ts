/**
 * Direct database repair script for fixing chatId values
 * 
 * This script directly connects to the database and fixes message/chat relations
 * without requiring a full TypeORM migration
 * 
 * Run with: npx ts-node src/scripts/fix-database.ts
 */

import * as pg from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database connection info from environment
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_DATABASE = process.env.DB_NAME || 'influencer_platform';

async function fixChatMessages() {
  // Create a database client
  const client = new pg.Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');

    // Step 1: Check for missing chatId values
    const { rows: messagesWithNullChatId } = await client.query(
      `SELECT id, content, "senderId", "recipientId", "chatId" 
       FROM message 
       WHERE "chatId" IS NULL`
    );
    
    console.log(`Found ${messagesWithNullChatId.length} messages with NULL chatId`);

    // If no messages with NULL chatId, we're done
    if (messagesWithNullChatId.length === 0) {
      console.log('No messages to fix');
      return;
    }

    // Step 2: Get all chats for matching
    const { rows: chats } = await client.query(
      `SELECT id, "senderId", "recipientId" FROM chat`
    );
    
    console.log(`Found ${chats.length} chats for matching`);

    // Step 3: Update each message with NULL chatId
    let fixedCount = 0;
    for (const message of messagesWithNullChatId) {
      // Find a chat that matches this message's sender/recipient pair
      const matchingChat = chats.find(chat => 
        (chat.senderId === message.senderId && chat.recipientId === message.recipientId) ||
        (chat.senderId === message.recipientId && chat.recipientId === message.senderId)
      );
      
      if (matchingChat) {
        // Update the message with the matching chat ID
        await client.query(
          `UPDATE message SET "chatId" = $1 WHERE id = $2`,
          [matchingChat.id, message.id]
        );
        fixedCount++;
      } else {
        console.log(`Could not find a matching chat for message ${message.id}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} messages with missing chatId`);
    
    // Step 4: Ensure all messages have a proper chat relation
    const { rows: totalMessages } = await client.query(
      `SELECT COUNT(*) as count FROM message`
    );
    
    const { rows: messagesWithChatId } = await client.query(
      `SELECT COUNT(*) as count FROM message WHERE "chatId" IS NOT NULL`
    );
    
    console.log(`Total messages: ${totalMessages[0].count}`);
    console.log(`Messages with chatId: ${messagesWithChatId[0].count}`);
    
    if (totalMessages[0].count === messagesWithChatId[0].count) {
      console.log('All messages now have a chatId!');
    } else {
      console.log('Some messages still have NULL chatId');
    }
    
  } catch (error) {
    console.error('Error fixing chat messages:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the fix
fixChatMessages()
  .then(() => {
    console.log('Repair script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in repair script:', error);
    process.exit(1);
  }); 
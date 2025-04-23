import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixChatMessages1724111111111 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get list of all messages and their existing relations
    const messages = await queryRunner.query(`
      SELECT m.id, m.content, m."senderId", m."recipientId", m."chatId"
      FROM message m
    `);
    
    // Get list of all chats
    const chats = await queryRunner.query(`
      SELECT c.id, c."senderId", c."recipientId"
      FROM chat c
    `);
    
    console.log(`Found ${messages.length} messages to check for chatId`);
    console.log(`Found ${chats.length} chats for matching`);
    
    // Update each message that has a null chatId
    let updatedCount = 0;
    for (const message of messages) {
      if (!message.chatId) {
        // Find a chat that matches this sender/recipient pair
        const matchingChat = chats.find(chat => 
          (chat.senderId === message.senderId && chat.recipientId === message.recipientId) ||
          (chat.senderId === message.recipientId && chat.recipientId === message.senderId)
        );
        
        if (matchingChat) {
          await queryRunner.query(
            `UPDATE message SET "chatId" = $1 WHERE id = $2`,
            [matchingChat.id, message.id]
          );
          updatedCount++;
        }
      }
    }
    
    console.log(`Updated ${updatedCount} messages with missing chatId`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No down migration needed, as we're just fixing data
  }
} 
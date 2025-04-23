import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatIdToMessages1745086101543 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, make the column nullable so we can add it to existing records
        await queryRunner.query(`ALTER TABLE "message" ALTER COLUMN "chatId" DROP NOT NULL`);
        
        // Then create a chat for each unique sender-recipient pair
        const messages = await queryRunner.query(`SELECT DISTINCT "senderId", "recipientId" FROM "message" WHERE "chatId" IS NULL`);
        
        for (const msg of messages) {
            // Create a chat for this sender-recipient pair
            const chatResult = await queryRunner.query(
                `INSERT INTO "chat" ("senderId", "recipientId", "unreadCount", "createdAt", "updatedAt") 
                 VALUES ($1, $2, 0, NOW(), NOW()) RETURNING id`,
                [msg.senderId, msg.recipientId]
            );
            
            const chatId = chatResult[0].id;
            
            // Update messages from this sender to this recipient
            await queryRunner.query(
                `UPDATE "message" SET "chatId" = $1 
                 WHERE "senderId" = $2 AND "recipientId" = $3 AND "chatId" IS NULL`,
                [chatId, msg.senderId, msg.recipientId]
            );
        }
        
        // Finally, make the column not nullable again
        await queryRunner.query(`ALTER TABLE "message" ALTER COLUMN "chatId" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // In the down migration, we make the column nullable again
        await queryRunner.query(`ALTER TABLE "message" ALTER COLUMN "chatId" DROP NOT NULL`);
    }

}

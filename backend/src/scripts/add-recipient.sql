-- SQL migration to add recipient_id column to message table and set values

-- First, make the column nullable temporarily
ALTER TABLE "message" 
ADD COLUMN "recipientId" uuid REFERENCES "user"("id");

-- Then update the recipients based on chat data
UPDATE "message" m
SET "recipientId" = 
  (SELECT 
    CASE 
      WHEN c."senderId" = m."senderId" THEN c."recipientId"
      ELSE c."senderId"
    END 
   FROM "chat" c 
   WHERE c."id" = m."chatId"
  );

-- Once data is populated, make the column non-nullable
ALTER TABLE "message" 
ALTER COLUMN "recipientId" SET NOT NULL;

-- Add an index for performance
CREATE INDEX idx_message_recipient ON "message" ("recipientId"); 
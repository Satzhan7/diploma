-- Direct SQL fix for chatId values in the messages table
-- Run this in your database management tool or via psql

-- Step 1: Check which messages have NULL chatId
SELECT id, content, "senderId", "recipientId", "chatId" 
FROM message 
WHERE "chatId" IS NULL;

-- Step 2: Find matching chats for each message based on sender and recipient
UPDATE message m
SET "chatId" = c.id
FROM chat c
WHERE m."chatId" IS NULL
AND (
  (m."senderId" = c."senderId" AND m."recipientId" = c."recipientId")
  OR 
  (m."senderId" = c."recipientId" AND m."recipientId" = c."senderId")
);

-- Step 3: Verify that all messages now have a chatId
SELECT COUNT(*) FROM message WHERE "chatId" IS NULL;

-- Step 4: Create chatId constraint if it doesn't exist
-- This will prevent future NULL chatId values
ALTER TABLE message 
ALTER COLUMN "chatId" SET NOT NULL; 
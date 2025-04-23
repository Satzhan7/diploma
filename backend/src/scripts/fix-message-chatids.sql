-- This SQL script will fix the chatId column in the message table
-- by looking it up from the related chat

-- First, check which messages don't have a chatId
SELECT m.id, m.content, c.id as chat_id
FROM message m
LEFT JOIN chat c ON m."chatId" = c.id
WHERE m."chatId" IS NULL;

-- Now update the messages to set the chatId
-- Step 1: Create a temporary table with chat IDs for messages without chatId
CREATE TEMP TABLE message_chat_fixes AS
SELECT m.id as message_id, c.id as chat_id
FROM message m
JOIN chat c ON (
  (m."senderId" = c."senderId" AND m."recipientId" = c."recipientId") OR
  (m."senderId" = c."recipientId" AND m."recipientId" = c."senderId")
)
WHERE m."chatId" IS NULL;

-- Step 2: Update the messages using the temporary table
UPDATE message m
SET "chatId" = mcf.chat_id
FROM message_chat_fixes mcf
WHERE m.id = mcf.message_id
  AND m."chatId" IS NULL;

-- Step 3: Verify the results
SELECT COUNT(*) as messages_without_chatid
FROM message m
WHERE m."chatId" IS NULL; 
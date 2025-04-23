# Database Migration Scripts

This directory contains database migration scripts to be run manually when needed.

## Migration: Add recipient to messages

There are two options to run this migration:

### Option 1: Using TypeScript

Run the TypeScript script:

```bash
# Go to backend directory
cd backend

# Run the script
npx ts-node -r tsconfig-paths/register src/scripts/add-recipient-to-messages.ts
```

### Option 2: Using SQL (preferred for production)

Run the SQL script directly:

```bash
# Connect to your database
psql -U your_db_user -d your_db_name

# Or run from file
psql -U your_db_user -d your_db_name -f src/scripts/add-recipient.sql
```

For Docker environments:

```bash
# If using Docker, first get into the container
docker exec -it your_db_container_name bash

# Then connect to the database
psql -U your_db_user -d your_db_name

# Or run the SQL file directly
cat src/scripts/add-recipient.sql | docker exec -i your_db_container_name psql -U your_db_user -d your_db_name
```

## Verifying the Migration

After running the migration, you can verify it worked by:

1. Checking that the `recipientId` column exists on the `message` table
2. Confirming all messages have a non-null recipient
3. Testing the chat functionality to send and receive messages

```sql
-- Run these queries to verify
SELECT COUNT(*) FROM message WHERE "recipientId" IS NULL;
-- Should return 0
``` 
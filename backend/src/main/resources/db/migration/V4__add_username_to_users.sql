-- Add username column to users table
ALTER TABLE users 
ADD COLUMN username VARCHAR(255) UNIQUE;

-- Set username for existing users based on email (prefix before @)
UPDATE users 
SET username = SPLIT_PART(email, '@', 1) || '_' || SUBSTR(CAST(id AS VARCHAR), 1, 8)
WHERE username IS NULL;

-- Make username NOT NULL going forward
ALTER TABLE users 
ALTER COLUMN username SET NOT NULL;

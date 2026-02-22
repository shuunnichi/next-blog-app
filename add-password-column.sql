-- Add password column to Device table
ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS "password" TEXT;

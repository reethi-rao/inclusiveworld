-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lineSpacing" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "petColor" TEXT NOT NULL DEFAULT '#7c9cff',
ADD COLUMN     "petName" TEXT NOT NULL DEFAULT 'Buddy',
ADD COLUMN     "petSpecies" TEXT NOT NULL DEFAULT 'cat',
ADD COLUMN     "readingFont" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "textScale" TEXT NOT NULL DEFAULT 'normal';

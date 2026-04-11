/*
  Warnings:

  - Added the required column `roundScores` to the `room_player` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `room` ADD COLUMN `currentRound` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `numRounds` INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE `room_player` ADD COLUMN `roundScores` LONGTEXT NOT NULL;

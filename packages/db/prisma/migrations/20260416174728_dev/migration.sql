/*
  Warnings:

  - You are about to drop the `achievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `active_solo_game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `daily_puzzle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leaderboard_entry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_achievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_streak` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `active_solo_game` DROP FOREIGN KEY `active_solo_game_userId_fkey`;

-- DropForeignKey
ALTER TABLE `leaderboard_entry` DROP FOREIGN KEY `leaderboard_entry_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_achievement` DROP FOREIGN KEY `user_achievement_achievementId_fkey`;

-- DropForeignKey
ALTER TABLE `user_achievement` DROP FOREIGN KEY `user_achievement_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_streak` DROP FOREIGN KEY `user_streak_userId_fkey`;

-- DropTable
DROP TABLE `achievement`;

-- DropTable
DROP TABLE `active_solo_game`;

-- DropTable
DROP TABLE `daily_puzzle`;

-- DropTable
DROP TABLE `leaderboard_entry`;

-- DropTable
DROP TABLE `user_achievement`;

-- DropTable
DROP TABLE `user_streak`;

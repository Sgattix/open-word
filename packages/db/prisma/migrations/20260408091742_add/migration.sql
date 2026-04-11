-- CreateTable
CREATE TABLE `game` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `difficulty` CHAR(20) NOT NULL,
    `wordLength` INTEGER NOT NULL,
    `guessWord` TEXT NOT NULL,
    `status` CHAR(10) NOT NULL,
    `guessesUsed` INTEGER NOT NULL,
    `attemptsLeft` INTEGER NOT NULL,
    `hintsUsed` INTEGER NOT NULL,
    `timeTaken` INTEGER NOT NULL,
    `score` INTEGER NOT NULL,
    `attemptBonus` INTEGER NOT NULL,
    `timeBonus` INTEGER NOT NULL,
    `difficultyMultiplier` DOUBLE NOT NULL,
    `guesses` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `game_userId_idx`(`userId`),
    INDEX `game_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `game` ADD CONSTRAINT `game_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

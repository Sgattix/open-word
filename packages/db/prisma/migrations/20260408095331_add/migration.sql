-- CreateTable
CREATE TABLE `room` (
    `id` VARCHAR(191) NOT NULL,
    `code` CHAR(6) NOT NULL,
    `hostId` VARCHAR(191) NOT NULL,
    `difficulty` CHAR(20) NOT NULL,
    `wordLength` INTEGER NOT NULL,
    `language` CHAR(10) NOT NULL DEFAULT 'en',
    `status` CHAR(20) NOT NULL DEFAULT 'waiting',
    `gameWord` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,

    UNIQUE INDEX `room_code_key`(`code`),
    INDEX `room_code_idx`(`code`),
    INDEX `room_status_idx`(`status`),
    INDEX `room_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_player` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NULL,
    `finalScore` INTEGER NOT NULL DEFAULT 0,
    `status` CHAR(20) NOT NULL DEFAULT 'playing',
    `guessesUsed` INTEGER NOT NULL DEFAULT 0,
    `hintsUsed` INTEGER NOT NULL DEFAULT 0,
    `finishedAt` DATETIME(3) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `guesses` LONGTEXT NOT NULL,

    INDEX `room_player_roomId_idx`(`roomId`),
    INDEX `room_player_userId_idx`(`userId`),
    UNIQUE INDEX `room_player_roomId_userId_key`(`roomId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `multiplayer_game` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `difficulty` CHAR(20) NOT NULL,
    `wordLength` INTEGER NOT NULL,
    `gameWord` TEXT NOT NULL,
    `language` CHAR(10) NOT NULL,
    `results` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `multiplayer_game_roomId_idx`(`roomId`),
    INDEX `multiplayer_game_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `room` ADD CONSTRAINT `room_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_player` ADD CONSTRAINT `room_player_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_player` ADD CONSTRAINT `room_player_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `multiplayer_game` ADD CONSTRAINT `multiplayer_game_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

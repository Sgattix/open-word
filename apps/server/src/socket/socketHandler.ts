import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import prisma from '@OpenWord/db';
import { evaluateGuess } from '@OpenWord/api/game/evaluator';

type PrismaClient = typeof prisma;

export interface GameState {
  roomId: string;
  word: string;
  players: Map<
    string,
    {
      userId: string;
      status: 'playing' | 'won' | 'lost';
      guessesUsed: number;
      roundScore: number;
      finishedAt: number | null;
    }
  >;
  startedAt: number;
}

const GAME_STATES = new Map<string, GameState>();

export function initializeSocket(httpServer: HTTPServer, db: PrismaClient) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room
    socket.on('room:join', async (data: { code: string; userId: string }) => {
      try {
        const room = await db.room.findUnique({
          where: { code: data.code },
          include: {
            players: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Add user to socket room
        socket.join(`room:${room.id}`);
        socket.data.roomId = room.id;
        socket.data.userId = data.userId;

        // Emit room state to all players
        io.to(`room:${room.id}`).emit('room:update', {
          roomId: room.id,
          status: room.status,
          currentRound: room.currentRound,
          numRounds: room.numRounds,
          wordLength: room.wordLength,
          players: room.players.map((p) => ({
            userId: p.userId,
            userName: p.user.name,
            userImage: p.user.image,
            status: p.status,
            guessesUsed: p.guessesUsed,
            rank: p.rank,
            finalScore: p.finalScore,
          })),
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Submit guess
    socket.on(
      'guess:submit',
      async (data: { roomId: string; guess: string }) => {
        try {
          const { roomId, guess } = data;
          const userId = socket.data.userId;

          // Get game state
          const gameState = GAME_STATES.get(`${roomId}_round_${socket.data.currentRound}`);
          if (!gameState) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          // Validate guess
          const normalizedGuess = guess.trim().toUpperCase();
          if (!/^[A-Z]+$/.test(normalizedGuess)) {
            socket.emit('error', { message: 'Guess must contain only letters' });
            return;
          }

          if (normalizedGuess.length !== gameState.word.length) {
            socket.emit('error', {
              message: `Guess must be ${gameState.word.length} letters`,
            });
            return;
          }

          // Evaluate guess
          const feedback = evaluateGuess(normalizedGuess, gameState.word);
          const isCorrect = feedback.every((f) => f === 'correct');

          const playerState = gameState.players.get(userId);
          if (!playerState) {
            socket.emit('error', { message: 'Player not found' });
            return;
          }

          playerState.guessesUsed += 1;

          // Emit guess result to user
          socket.emit('guess:result', {
            correct: isCorrect,
            feedback,
            guessesUsed: playerState.guessesUsed,
          });

          if (isCorrect) {
            const timeTaken = Date.now() - gameState.startedAt;
            playerState.status = 'won';
            playerState.finishedAt = Date.now();
            playerState.roundScore = Math.max(0, 1000 - Math.floor(timeTaken / 100));

            // Update database
            await db.roomPlayer.update({
              where: {
                roomId_userId: { roomId, userId },
              },
              data: {
                status: 'won',
                finishedAt: new Date(),
              },
            });
          }

          // Broadcast leaderboard update
          const players = Array.from(gameState.players.values());
          const leaderboard = players
            .sort((a, b) => b.roundScore - a.roundScore)
            .map((p, idx) => ({
              userId: p.userId,
              status: p.status,
              guessesUsed: p.guessesUsed,
              score: p.roundScore,
              rank: idx + 1,
            }));

          io.to(`room:${roomId}`).emit('leaderboard:update', leaderboard);
        } catch (error) {
          console.error('Error submitting guess:', error);
          socket.emit('error', { message: 'Failed to process guess' });
        }
      }
    );

    // Start game
    socket.on('game:start', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        const room = await db.room.findUnique({
          where: { id: roomId },
          include: { players: true },
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Fetch random word
        const endpoint = new URL('https://random-words-api.kushcreates.com/api');
        endpoint.searchParams.set('length', room.wordLength.toString());
        endpoint.searchParams.set('words', '1');
        const response = await fetch(endpoint);
        const payload = (await response.json()) as [{ word?: string }];
        const word = payload[0]?.word?.toUpperCase();

        if (!word) {
          socket.emit('error', { message: 'Failed to fetch word' });
          return;
        }

        // Initialize game state
        const gameKey = `${roomId}_round_${room.currentRound + 1}`;
        const gameState: GameState = {
          roomId,
          word,
          players: new Map(
            room.players.map((p) => [
              p.userId,
              {
                userId: p.userId,
                status: 'playing',
                guessesUsed: 0,
                roundScore: 0,
                finishedAt: null,
              },
            ])
          ),
          startedAt: Date.now(),
        };

        GAME_STATES.set(gameKey, gameState);
        socket.data.currentRound = room.currentRound + 1;

        // Broadcast game started
        io.to(`room:${roomId}`).emit('game:started', {
          round: room.currentRound + 1,
          wordLength: room.wordLength,
        });
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.data.roomId) {
        io.to(`room:${socket.data.roomId}`).emit('player:disconnected', {
          userId: socket.data.userId,
        });
      }
    });
  });

  return io;
}

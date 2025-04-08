import { Room, Player, GameState, Question } from './types';

class RoomManager {
  private rooms: Map<string, Room> = new Map();

  generateRoomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    
    do {
      code = Array.from(
        { length: 6 },
        () => characters[Math.floor(Math.random() * characters.length)]
      ).join('');
    } while (this.rooms.has(code));

    return code;
  }

  createRoom(hostName: string, rounds: number, enableGuessing: boolean, socketId: string): Room {
    const roomCode = this.generateRoomCode();
    const hostId = Math.random().toString(36).substring(2);
    
    const room: Room = {
      code: roomCode,
      hostId,
      rounds,
      enableGuessing,
      players: [{
        id: hostId,
        socketId: socketId,
        name: hostName,
        isHost: true,
        hasSubmittedQuestions: false,
        assignedTargets: [],
        receivedQuestions: []
      }],
      gameState: 'waiting',
      questions: [],
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  addPlayer(roomCode: string, playerName: string, socketId: string): Player {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.players.length >= 25) throw new Error('Room is full');
    
    const player: Player = {
      id: Math.random().toString(36).substring(2),
      socketId: socketId,
      name: playerName,
      isHost: false,
      hasSubmittedQuestions: false,
      assignedTargets: [],
      receivedQuestions: []
    };

    room.players.push(player);
    return player;
  }

  removePlayer(roomCode: string, playerId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    
    // If room is empty or host left, remove the room
    if (room.players.length === 0 || playerId === room.hostId) {
      this.rooms.delete(roomCode);
    }
  }

  // Given Constraint: Number of rounds (X) ≤ Number of players - 1
  // The following guarantees must be met and prioritized over perfect randomness:
  // 1. each player gets X assignedTargets, where X = number of question rounds
  // 2. each player will be an assignedTarget X times amongst all player
  // 3. a player's assignedTarget must not include itself
  assignBalancedTargets(roomCode: string): Room {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    const { players, rounds } = room;
    
    // Validate our constraint
    if (rounds > players.length - 1) {
      throw new Error('Number of rounds exceeds maximum allowed (players - 1)');
    }
  
    // Reset all assignedTargets
    players.forEach(player => {
      player.assignedTargets = [];
    });
  
    // Define our mapping types
    const positionToPlayerId: { [position: number]: string } = {};
    const playerIdToPosition: { [playerId: string]: number } = {};
    
    // 1. Create a randomized mapping of real players to positions in our algorithm
    const playerIds: string[] = players.map(p => p.id);
    
    // Shuffle the player IDs to add perceived randomness
    const shuffledOrder: string[] = [...playerIds].sort(() => Math.random() - 0.5);
    
    // Create a mapping from algorithm position to actual player ID
    shuffledOrder.forEach((playerId, index) => {
      positionToPlayerId[index] = playerId;
      playerIdToPosition[playerId] = index;
    });
    
    // 2. For each round, create perfect balanced assignments using a rotation pattern
    for (let round = 0; round < rounds; round++) {
      const n: number = players.length;
      
      // For each player position, determine their target position using rotation
      for (let position = 0; position < n; position++) {
        // Calculate target position using rotation
        const targetPosition: number = (position + 1 + round) % n;
        
        if (targetPosition === position) {
          // This shouldn't happen with the rotation formula, but as a safety check
          throw new Error('Self-targeting detected in the algorithm');
        }
        
        // Convert algorithm positions back to actual player IDs
        const askerId: string = positionToPlayerId[position];
        const targetId: string = positionToPlayerId[targetPosition];
        
        // Find the actual player objects
        const asker: Player | undefined = players.find(p => p.id === askerId);
        const target: Player | undefined = players.find(p => p.id === targetId);
        
        if (!asker || !target) {
          throw new Error('Player not found in mapping');
        }
        
        // Assign the target
        asker.assignedTargets.push({
          id: target.id,
          name: target.name
        });
      }
    }
    
    // Verify our guarantees
    // 1. Each player has exactly X assigned targets
    for (const player of players) {
      if (player.assignedTargets.length !== rounds) {
        throw new Error(`Player ${player.id} has ${player.assignedTargets.length} targets instead of ${rounds}`);
      }
    }
    
    // 2. Each player is targeted exactly X times
    const targetCounts: { [playerId: string]: number } = {};
    players.forEach(player => {
      targetCounts[player.id] = 0;
    });
    
    players.forEach(player => {
      player.assignedTargets.forEach(target => {
        targetCounts[target.id]++;
      });
    });
    
    for (const playerId in targetCounts) {
      if (targetCounts[playerId] !== rounds) {
        throw new Error(`Player ${playerId} is targeted ${targetCounts[playerId]} times instead of ${rounds}`);
      }
    }
    
    return room;
  }
}

export const roomManager = new RoomManager();

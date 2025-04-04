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

  createRoom(hostName: string, rounds: number, enableGuessing: boolean): Room {
    const roomCode = this.generateRoomCode();
    const hostId = Math.random().toString(36).substring(2);
    
    const room: Room = {
      code: roomCode,
      hostId,
      rounds,
      enableGuessing,
      players: [{
        id: hostId,
        name: hostName,
        isHost: true,
        hasSubmittedQuestions: false
      }],
      gameState: 'waiting',
      questions: [],
      assignments: []
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  addPlayer(roomCode: string, playerName: string): Player {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.players.length >= 25) throw new Error('Room is full');
    
    const player: Player = {
      id: Math.random().toString(36).substring(2),
      name: playerName,
      isHost: false,
      hasSubmittedQuestions: false
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
}

export const roomManager = new RoomManager();

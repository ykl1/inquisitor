// Types
export type GameState = 'waiting' | 'submitting' | 'playing' | 'finished';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  hasSubmittedQuestions: boolean;
  assignedTargets: assignedTarget[];
  receivedQuestions: Question[];
}

export interface assignedTarget {
  id: string;
  name: string
}

export type Question = {
  id: string;
  text: string;
  askedById: string;
  targetPlayerId: string;
  isAnswered: boolean;
};

export interface Room {
  code: string;
  hostId: string;
  rounds: number;
  enableGuessing: boolean;
  players: Player[];
  gameState: GameState;
  questions: Question[];
  totalPlayersThatSubmittedQuestions: number;
}

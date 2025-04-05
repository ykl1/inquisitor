export interface Room {
  code: string;
  hostId: string;
  rounds: number;
  enableGuessing: boolean;
  players: Player[];
  gameState: GameState;
  questions: Question[];
  assignments: QuestionAssignment[];
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  isHost: boolean;
  hasSubmittedQuestions: boolean;
}

export interface Question {
  id: string;
  text: string;
  askedById: string;
  targetPlayerId: string;
  isAnswered: boolean;
}

export interface QuestionAssignment {
  askerId: string;
  targetId: string;
}

export type GameState = 'waiting' | 'submitting' | 'playing' | 'finished';

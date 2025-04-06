// Types
export type GameState = 'waiting' | 'submitting' | 'playing' | 'finished';

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  hasSubmittedQuestions: boolean;
};

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
  assignments: QuestionAssignment[];
}

export interface QuestionAssignment {
  askerId: string;
  targetId: string;
}

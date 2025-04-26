export interface Room {
  code: string;
  hostId: string;
  rounds: number;
  enableGuessing: boolean;
  players: Player[];
  gameState: GameState;
  questions: Question[];
  totalPlayersThatSubmittedQuestions: number;
  currentRound: number;
  currentPlayerIdx: number;
  currentAnsweringPlayer: Player | null;
  currentQuestionBeingAnswered: Question | null;
  answeredQuestionIds: Set<string>;
}

export interface Player {
  id: string;
  socketId: string;
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

export interface Question {
  id: string;
  text: string;
  askedById: string;
  targetPlayerId: string;
  isAnswered: boolean;
}

export type GameState = 'waiting' | 'submitting' | 'playing' | 'finished' | "error";

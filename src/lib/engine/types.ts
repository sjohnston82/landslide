export type Region = "MIDWEST" | "WEST" | "SOUTH" | "EAST";

export type Player = {
  id: string;
  name: string;
  region: Region;
  homeState: string;
  boardPosition: number;
  voteHand: string[];
  politicsHand: string[];
  wonStates: string[];
};

export type VoteCard = {
  id: string;
  value: number;
};

export type StateCard = {
  id: string;
  name: string;
  electoralVotes: number;
};

export type PoliticsEffect =
  | { type: "STEAL_CARD" }
  | { type: "GAMBLE"; stake: string }
  | { type: "FLY_ANYWHERE" }
  | { type: "STOP" }
  | { type: "EXTRA_TURN" }
  | { type: "DEBATE"; opponentId: string };

export type PoliticsCard = {
  id: string;
  effect: PoliticsEffect;
};

export type GameState = {
  players: Player[];

  stateCardsById: Record<string, StateCard>;

  voteCardsById: Record<string, VoteCard>;
  voteDeck: string[];
  voteDiscard: string[];

  politicsCardsById: Record<string, PoliticsCard>;
  politicsDeck: string[];
  politicsDiscard: string[];

  currentTurnPlayerId: string;
  phaseStack: GamePhase[];
};

export type GamePhase =
  | "TURN_START"
  | "AWAITING_ROLL"
  | "MOVING"
  | "RESOLVING_SPACE"
  | "OPEN_BALLOT"
  | "AUCTION"
  | "GAME_OVER"
  | "POLITICS_ACTION"
  | "TURN_END";

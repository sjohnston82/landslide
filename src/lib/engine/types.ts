export type PlayerId = string & { readonly __brand: "PlayerId" };
export type StateCardId = string & { readonly __brand: "StateCardId" };
export type VoteCardId = string & { readonly __brand: "VoteCardId" };
export type PoliticsCardId = string & { readonly __brand: "PoliticsCardId" };

export function toPlayerId(id: string): PlayerId {
  return id as PlayerId;
}
export function toStateCardId(id: string): StateCardId {
  return id as StateCardId;
}
export function toVoteCardId(id: string): VoteCardId {
  return id as VoteCardId;
}
export function toPoliticsCardId(id: string): PoliticsCardId {
  return id as PoliticsCardId;
}

export type Region = "MIDWEST" | "WEST" | "SOUTH" | "EAST";

export type Player = {
  id: PlayerId;
  name: string;
  region: Region;
  homeState: StateCardId;
  boardPosition: number;
  voteHand: VoteCardId[];
  politicsHand: PoliticsCardId[];
  wonStates: StateCardId[];
};

export type VoteCard = {
  id: VoteCardId;
  value: number;
};

export type StateCard = {
  id: StateCardId;
  name: string;
  electoralVotes: number;
};

export type PoliticsEffect =
  | { type: "STEAL_CARD" }
  | { type: "GAMBLE"; stake: StateCardId }
  | { type: "FLY_ANYWHERE" }
  | { type: "STOP" }
  | { type: "EXTRA_TURN" }
  | { type: "DEBATE"; opponentId: PlayerId };

export type PoliticsCard = {
  id: PoliticsCardId;
  effect: PoliticsEffect;
};

export type GameState = {
  players: Player[];

  stateCardsById: Record<StateCardId, StateCard>;

  voteCardsById: Record<VoteCardId, VoteCard>;
  voteDeck: VoteCardId[];
  voteDiscard: VoteCardId[];

  politicsCardsById: Record<PoliticsCardId, PoliticsCard>;
  politicsDeck: PoliticsCardId[];
  politicsDiscard: PoliticsCardId[];

  currentTurnPlayerId: PlayerId;

  phaseStack: GamePhase[];

  currentAuction: AuctionState | null;
};

export type AuctionState = {
  stateCardId: StateCardId;
  highestBid: number;
  highestBidderId: PlayerId | null;
  activeBidderIds: PlayerId[];
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

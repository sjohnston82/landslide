import type { GameState, Player } from "./types";
import { toPlayerId, toStateCardId } from "./types";

export function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: toPlayerId("p1"),
    name: "Test Player",
    region: "EAST",
    homeState: toStateCardId("NY"),
    boardPosition: 0,
    voteHand: [],
    politicsHand: [],
    wonStates: [],
    ...overrides,
  };
}

export function createTestState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createTestPlayer({ id: toPlayerId("p1") });
  const player2 = createTestPlayer({
    id: toPlayerId("p2"),
    name: "Player Two",
  });

  return {
    players: [player1, player2],
    stateCardsById: {},
    voteCardsById: {},
    voteDeck: [],
    voteDiscard: [],
    currentAuction: null,
    politicsCardsById: {},
    politicsDeck: [],
    politicsDiscard: [],
    currentTurnPlayerId: player1.id,
    phaseStack: ["AWAITING_ROLL"],
    ...overrides,
  };
}

// action dispatches

import { getCurrentPhase, replacePhase } from "./phase";
import type { GameState } from "./types";
import type { GameAction } from "./actions";
import { getPlayerVoteTotal } from "./selectors";

const BOARD_SIZE = 40; // placeholder — confirm actual space count later

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function handleRollDie(
  state: GameState,
  action: Extract<GameAction, { type: "ROLL_DIE" }>,
  roll: number = rollDie()
): GameState {
  if (getCurrentPhase(state) !== "AWAITING_ROLL") {
    throw new Error("Cannot roll die outside of AWAITING_ROLL phase");
  }

  const rollingPlayer = state.players.find(
    (p) => p.id === state.currentTurnPlayerId
  );

  if (!rollingPlayer) {
    throw new Error("Current turn player not found");
  }

  if (rollingPlayer.id !== action.playerId) {
    throw new Error(
      "Player attempting to roll die is not the current turn player"
    );
  }

  const newPosition = (rollingPlayer.boardPosition + roll) % BOARD_SIZE;

  const updatedPlayer = { ...rollingPlayer, boardPosition: newPosition };

  const updatedPlayers = state.players.map((p) =>
    p.id === updatedPlayer.id ? updatedPlayer : p
  );

  return replacePhase({ ...state, players: updatedPlayers }, "RESOLVING_SPACE");
}

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ROLL_DIE":
      return handleRollDie(state, action);
    case "PLACE_BID":
      return handlePlaceBid(state, action);
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export function handlePlaceBid(
  state: GameState,
  action: Extract<GameAction, { type: "PLACE_BID" }>
): GameState {
  if (getCurrentPhase(state) !== "AUCTION") {
    throw new Error("Cannot place bid outside of AUCTION phase");
  }

  if (state.currentAuction === null) {
    throw new Error("No active auction to place a bid in");
  }

  if (
    state.currentAuction.activeBidderIds.includes(action.playerId) === false
  ) {
    throw new Error("Player is not an active bidder in this auction");
  }

  if (action.bidAmount <= state.currentAuction.highestBid) {
    throw new Error("Bid must exceed the current highest bid");
  }

  if (action.bidAmount > getPlayerVoteTotal(state, action.playerId)) {
    throw new Error("Bid amount exceeds player's available votes");
  }

  const updatedAuction = {
    ...state.currentAuction,
    highestBid: action.bidAmount,
    highestBidderId: action.playerId,
  };

  return { ...state, currentAuction: updatedAuction };
}

// src/lib/engine/reducer.ts
import { getCurrentPhase, replacePhase } from "./phase";
import { getNextPlayerId } from "./selectors";
import { BOARD_SIZE, MIN_OPENING_BID } from "./constants";
import type { GameState } from "./types";
import type { GameAction } from "./actions";

// ---------------------------------------------------------------------------
// ROLL_DIE
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// PLACE_BID
// Turn-based per the official rules: bidding goes clockwise, a pass is not
// elimination, overbidding is legal (the penalty comes at settlement).
// ---------------------------------------------------------------------------

export function handlePlaceBid(
  state: GameState,
  action: Extract<GameAction, { type: "PLACE_BID" }>
): GameState {
  if (getCurrentPhase(state) !== "AUCTION") {
    throw new Error("Cannot place bid outside of AUCTION phase");
  }

  const auction = state.currentAuction;
  if (auction === null) {
    throw new Error("No active auction to place a bid in");
  }

  if (action.playerId !== auction.currentBidderId) {
    throw new Error("It is not this player's turn to bid");
  }

  const isOpeningBid = auction.highestBidderId === null;

  if (isOpeningBid && action.bidAmount < MIN_OPENING_BID) {
    throw new Error(`Opening bid must be at least ${MIN_OPENING_BID}`);
  }

  if (!isOpeningBid && action.bidAmount <= auction.highestBid) {
    throw new Error("Bid must exceed the current highest bid");
  }

  const updatedAuction = {
    ...auction,
    highestBid: action.bidAmount,
    highestBidderId: action.playerId,
    consecutivePasses: 0,
    currentBidderId: getNextPlayerId(state, action.playerId),
  };

  return { ...state, currentAuction: updatedAuction };
}

// ---------------------------------------------------------------------------
// PASS_AUCTION  (SKELETON: guards and turn handoff done, ending logic is yours)
// ---------------------------------------------------------------------------

export function handlePassAuction(
  state: GameState,
  action: Extract<GameAction, { type: "PASS_AUCTION" }>
): GameState {
  if (getCurrentPhase(state) !== "AUCTION") {
    throw new Error("Cannot pass: game is not in the AUCTION phase");
  }

  const auction = state.currentAuction;
  if (auction === null) {
    throw new Error("Cannot pass: there is no active auction");
  }

  if (action.playerId !== auction.currentBidderId) {
    throw new Error("Cannot pass: it is not this player's turn to bid");
  }

  const updatedAuction = {
    ...auction,
    consecutivePasses: auction.consecutivePasses + 1,
  };

  const hasBid = updatedAuction.highestBidderId !== null;
  const passesNeeded = hasBid ? state.players.length - 1 : state.players.length;

  if (updatedAuction.consecutivePasses < passesNeeded) {
    return {
      ...state,
      currentAuction: {
        ...updatedAuction,
        currentBidderId: getNextPlayerId(state, auction.currentBidderId),
      },
    };
  }

  if (!hasBid) {
    // TODO: return the state card(s) to the regional deck once decks are modeled
    return replacePhase({ ...state, currentAuction: null }, "TURN_END");
  }

  return replacePhase(
    { ...state, currentAuction: updatedAuction },
    "AUCTION_SETTLEMENT"
  );
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ROLL_DIE":
      return handleRollDie(state, action);
    case "PLACE_BID":
      return handlePlaceBid(state, action);
    case "PASS_AUCTION":
      return handlePassAuction(state, action);
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// action dispatches

import { getCurrentPhase, replacePhase } from "./phase";
import type { GameState } from "./types";
import type { GameAction } from "./actions";

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
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

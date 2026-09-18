// action dispatches

import { getCurrentPhase, replacePhase } from "./phase";
import type { GameState } from "./types";
import type { GameAction } from "./actions";

const BOARD_SIZE = 40; // placeholder — confirm actual space count later

function handleRollDie(
  state: GameState,
  action: Extract<GameAction, { type: "ROLL_DIE" }>
): GameState {
  if (getCurrentPhase(state) !== "AWAITING_ROLL") {
    throw new Error("Cannot roll die outside of AWAITING_ROLL phase");
  }

  const dieRoll = Math.floor(Math.random() * 6) + 1;

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

  const newPosition = (rollingPlayer.boardPosition + dieRoll) % BOARD_SIZE;

  const updatedPlayer = { ...rollingPlayer, boardPosition: newPosition };

  const updatedPlayers = state.players.map((p) =>
    p.id === updatedPlayer.id ? updatedPlayer : p
  );

  replacePhase(state, "RESOLVING_SPACE");

  return { ...state, players: updatedPlayers };
}

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ROLL_DIE":
      return handleRollDie(state, action);
    // other cases come later
  }
}

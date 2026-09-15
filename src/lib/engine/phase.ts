// current, advance, push and pop logic

import type { GameState, GamePhase } from "./types";

export function getCurrentPhase(state: GameState): GamePhase {
  return state.phaseStack[state.phaseStack.length - 1];
}

export function popPhase(state: GameState): GameState {
  if (state.phaseStack.length <= 1) {
    throw new Error("Cannot pop the last phase from the stack");
  }
  return {
    ...state,
    phaseStack: state.phaseStack.slice(0, -1),
  };
}

export function pushPhase(state: GameState, newPhase: GamePhase): GameState {
  return {
    ...state,
    phaseStack: [...state.phaseStack, newPhase],
  };
}

export function replacePhase(state: GameState, newPhase: GamePhase): GameState {
  return { ...state, phaseStack: [...state.phaseStack.slice(0, -1), newPhase] };
}

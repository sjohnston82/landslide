import { describe, expect, it } from "vitest";

import { applyAction, handleRollDie } from "./reducer";
import { toPlayerId, type GameState } from "./types";
import type { GameAction } from "./actions";
import { createTestState } from "./test-helpers";
import { getCurrentPhase } from "./phase";

describe("successful ROLL_DIE action, moves board position and changes phase", () => {
  it("updates the player's position and changes the phase to RESOLVING_SPACE", () => {
    const initialState = createTestState();

    const result = handleRollDie(
      initialState,
      { type: "ROLL_DIE", playerId: toPlayerId("p1") },
      4
    );

    const updatedPlayer = result.players.find((p) => p.id === toPlayerId("p1"));
    expect(updatedPlayer?.boardPosition).toBe(4);
    expect(getCurrentPhase(result)).toBe("RESOLVING_SPACE");
  });
});

describe("wrong phase error", () => {
  it("throws an error if the phase is not AWAITING_ROLL", () => {
    const initialState = createTestState({
      phaseStack: ["TURN_START"],
    });

    expect(() =>
      handleRollDie(initialState, {
        type: "ROLL_DIE",
        playerId: toPlayerId("p1"),
      })
    ).toThrow("Cannot roll die outside of AWAITING_ROLL phase");
  });
});

describe("wrong player error", () => {
  it("throws an error if the player attempting to roll is not the current turn player", () => {
    const initialState = createTestState({
      currentTurnPlayerId: toPlayerId("p2"),
    });

    expect(() =>
      handleRollDie(initialState, {
        type: "ROLL_DIE",
        playerId: toPlayerId("p1"),
      })
    ).toThrow("Player attempting to roll die is not the current turn player");
  });
});

import { describe, it, expect } from "vitest";
import { getCurrentPhase, pushPhase, popPhase, replacePhase } from "./phase";
import type { GameState } from "./types";

describe("getCurrentPhase", () => {
  it("return the last item in the stack", () => {
    const state = {
      phaseStack: ["TURN_START", "AWAITING_ROLL", "MOVING"],
    } as GameState;

    const result = getCurrentPhase(state);

    expect(result).toBe("MOVING");
  });
});

describe("pushPhase", () => {
  it("adds a new phase to the end of the stack", () => {
    const state = {
      phaseStack: ["TURN_START", "AWAITING_ROLL"],
    } as GameState;

    const newPhase = "MOVING";
    const result = pushPhase(state, newPhase);

    expect(result.phaseStack).toEqual([
      "TURN_START",
      "AWAITING_ROLL",
      "MOVING",
    ]);
  });

  it("does not modify the original state", () => {
    const state = {
      phaseStack: ["TURN_START", "AWAITING_ROLL"],
    } as GameState;

    const newPhase = "MOVING";
    pushPhase(state, newPhase);

    expect(state.phaseStack).toEqual(["TURN_START", "AWAITING_ROLL"]);
  });
});

describe("popPhase", () => {
  it("removes the last phase from the stack", () => {
    const state = {
      phaseStack: ["TURN_START", "AWAITING_ROLL", "MOVING"],
    } as GameState;

    const result = popPhase(state);

    expect(result.phaseStack).toEqual(["TURN_START", "AWAITING_ROLL"]);
  });

  it("throws an error if trying to pop the last phase", () => {
    const state = {
      phaseStack: ["TURN_START"],
    } as GameState;

    const result = () => popPhase(state);

    expect(result).toThrowError("Cannot pop the last phase from the stack");
  });

  it("does not modify the original state", () => {
    const state = {
      phaseStack: ["TURN_START", "AWAITING_ROLL", "MOVING"],
    } as GameState;

    popPhase(state);

    expect(state.phaseStack).toEqual(["TURN_START", "AWAITING_ROLL", "MOVING"]);
  });
});

describe("replacePhase", () => {
  it("replaces the last phase in the stack with a new phase", () => {
    const state = {
      phaseStack: ["TURN_START", "AWAITING_ROLL", "MOVING"],
    } as GameState;

    const newPhase = "RESOLVING_SPACE";
    const result = replacePhase(state, newPhase);

    expect(result.phaseStack).toEqual([
      "TURN_START",
      "AWAITING_ROLL",
      "RESOLVING_SPACE",
    ]);
  });

  it("does not modify the original state", () => {
    const state = {
      phaseStack: ["TURN_START", "AWAITING_ROLL", "MOVING"],
    } as GameState;

    const newPhase = "RESOLVING_SPACE";
    replacePhase(state, newPhase);

    expect(state.phaseStack).toEqual(["TURN_START", "AWAITING_ROLL", "MOVING"]);
  });

  it("succeeds without throwing when replacing the only phase in the stack", () => {
    const state = {
      phaseStack: ["TURN_START"],
    } as GameState;

    const result = replacePhase(state, "AWAITING_ROLL");

    expect(result.phaseStack).toEqual(["AWAITING_ROLL"]);
  });
});

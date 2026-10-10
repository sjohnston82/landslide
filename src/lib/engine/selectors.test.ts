import { describe, expect, it } from "vitest";
import { getPlayerSpendingPower } from "./selectors";
import { createTestPlayer, createTestState } from "./test-helpers";
import { toPlayerId, toStateCardId, toVoteCardId } from "./types";

describe("getPlayerSpendingPower", () => {
  it("returns 0 for a player with no vote cards and no states", () => {
    const state = createTestState({
      players: [createTestPlayer({ id: toPlayerId("p1") })],
    });

    expect(getPlayerSpendingPower(state, toPlayerId("p1"))).toBe(0);
  });

  it("counts vote cards at face value", () => {
    const v1 = toVoteCardId("v1");
    const v2 = toVoteCardId("v2");

    const state = createTestState({
      players: [createTestPlayer({ id: toPlayerId("p1"), voteHand: [v1, v2] })],
      voteCardsById: {
        [v1]: { id: v1, value: 100_000 },
        [v2]: { id: v2, value: 250_000 },
      },
    });

    expect(getPlayerSpendingPower(state, toPlayerId("p1"))).toBe(350_000);
  });

  it("counts each won state at electoralVotes x 100_000", () => {
    const s1 = toStateCardId("s1");

    const state = createTestState({
      players: [
        createTestPlayer({
          id: toPlayerId("p1"),
          wonStates: [s1],
        }),
      ],
      stateCardsById: {
        [s1]: { id: s1, name: "Test State", electoralVotes: 4 },
      },
    });

    expect(getPlayerSpendingPower(state, toPlayerId("p1"))).toBe(400_000);
  });

  it("sums multiple won states", () => {
    const s1 = toStateCardId("s1");
    const s2 = toStateCardId("s2");

    const state = createTestState({
      players: [
        createTestPlayer({ id: toPlayerId("p1"), wonStates: [s1, s2] }),
      ],
      stateCardsById: {
        [s1]: { id: s1, name: "State One", electoralVotes: 4 },
        [s2]: { id: s2, name: "State Two", electoralVotes: 3 },
      },
    });

    expect(getPlayerSpendingPower(state, toPlayerId("p1"))).toBe(700_000);
  });

  it("does not count the player's home state", () => {
    const home = toStateCardId("home");

    const state = createTestState({
      players: [
        createTestPlayer({
          id: toPlayerId("p1"),
          homeState: home,
          wonStates: [],
        }),
      ],
      stateCardsById: {
        [home]: { id: home, name: "Home State", electoralVotes: 4 },
      },
    });

    expect(getPlayerSpendingPower(state, toPlayerId("p1"))).toBe(0);
  });

  it("throws if the player does not exist", () => {
    const state = createTestState({
      players: [createTestPlayer({ id: toPlayerId("p1") })],
    });

    expect(() => getPlayerSpendingPower(state, toPlayerId("p2"))).toThrow(
      "not found"
    );
  });
});

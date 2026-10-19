import { describe, expect, it } from "vitest";
import { returnStateToDeck } from "./decks";
import { createTestState } from "./test-helpers";
import { toStateCardId } from "./types";
import type { StateCard } from "./types";

const reverse = <T>(items: readonly T[]): T[] => [...items].reverse();

function eastCard(id: string, electoralVotes = 4): StateCard {
  return {
    id: toStateCardId(id),
    name: id,
    electoralVotes,
    region: "EAST",
  };
}

describe("returnStateToDeck", () => {
  it("puts the card into its own region's deck and leaves other decks alone", () => {
    const a = toStateCardId("a");
    const b = toStateCardId("b");
    const west = toStateCardId("w");

    const state = createTestState({
      stateCardsById: {
        [a]: eastCard("a"),
        [b]: eastCard("b"),
        [west]: { ...eastCard("w"), region: "WEST" },
      },
      stateDecks: { MIDWEST: [], WEST: [west], SOUTH: [], EAST: [a] },
    });

    // b is out of every deck (e.g. forfeited by a player), now it returns
    const result = returnStateToDeck(state, b, reverse);

    expect(result.stateDecks.EAST).toHaveLength(2);
    expect(result.stateDecks.EAST).toContain(a);
    expect(result.stateDecks.EAST).toContain(b);
    expect(result.stateDecks.WEST).toEqual([west]);
    expect(result.stateDecks.MIDWEST).toEqual([]);
    expect(result.stateDecks.SOUTH).toEqual([]);
  });

  it("uses the injected shuffle for the new order", () => {
    const a = toStateCardId("a");
    const b = toStateCardId("b");
    const c = toStateCardId("c");

    const state = createTestState({
      stateCardsById: {
        [a]: eastCard("a"),
        [b]: eastCard("b"),
        [c]: eastCard("c"),
      },
      stateDecks: { MIDWEST: [], WEST: [], SOUTH: [], EAST: [a, b] },
    });

    const result = returnStateToDeck(state, c, reverse);

    // deck before shuffle is [a, b, c], reversed is [c, b, a]
    expect(result.stateDecks.EAST).toEqual([c, b, a]);
  });

  it("doesn't mutate the original state", () => {
    const a = toStateCardId("a");
    const b = toStateCardId("b");
    const c = toStateCardId("c");

    const state = createTestState({
      stateCardsById: {
        [a]: eastCard("a"),
        [b]: eastCard("b"),
        [c]: eastCard("c"),
      },
      stateDecks: { MIDWEST: [], WEST: [], SOUTH: [], EAST: [a, b] },
    });

    returnStateToDeck(state, c, reverse);

    expect(state.stateDecks.EAST).toEqual([a, b]);
  });

  it("throws if the card is already in a deck", () => {
    const a = toStateCardId("a");

    const state = createTestState({
      stateCardsById: {
        [a]: eastCard("a"),
      },
      stateDecks: { MIDWEST: [], WEST: [], SOUTH: [], EAST: [a] },
    });

    expect(() => returnStateToDeck(state, a, reverse)).toThrow(
      "already in a deck"
    );
  });

  it("throws if the card is not in stateCardsById", () => {
    const state = createTestState({
      stateCardsById: {},
      stateDecks: { MIDWEST: [], WEST: [], SOUTH: [], EAST: [] },
    });

    expect(() =>
      returnStateToDeck(state, toStateCardId("ghost"), reverse)
    ).toThrow("not found");
  });
});

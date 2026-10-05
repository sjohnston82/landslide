// src/lib/engine/reducer.test.ts
import { describe, expect, it } from "vitest";

import { applyAction, handleRollDie, handlePlaceBid } from "./reducer";
import { toPlayerId } from "./types";
import {
  createTestState,
  createTestAuctionGameState,
  createTestAuctionState,
} from "./test-helpers";
import { getCurrentPhase } from "./phase";

// DICE ROLL TESTS

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

// AUCTION TESTS
// Default fixture: STATE auction, p1 is both seller and current bidder,
// nobody has bid yet (highestBid 0, highestBidderId null).

describe("handlePlaceBid", () => {
  it("accepts an opening bid at the 250,000 minimum and passes the turn to the next bidder", () => {
    const initialState = createTestAuctionGameState();

    const result = handlePlaceBid(initialState, {
      type: "PLACE_BID",
      playerId: toPlayerId("p1"),
      bidAmount: 250_000,
    });

    expect(result.currentAuction?.highestBid).toBe(250_000);
    expect(result.currentAuction?.highestBidderId).toBe(toPlayerId("p1"));
    expect(result.currentAuction?.currentBidderId).toBe(toPlayerId("p2"));
    expect(result.currentAuction?.consecutivePasses).toBe(0);
  });

  it("resets consecutivePasses when a bid raises the price", () => {
    const initialState = createTestAuctionGameState({
      currentAuction: createTestAuctionState({
        highestBid: 250_000,
        highestBidderId: toPlayerId("p2"),
        currentBidderId: toPlayerId("p1"),
        consecutivePasses: 1,
      }),
    });

    const result = handlePlaceBid(initialState, {
      type: "PLACE_BID",
      playerId: toPlayerId("p1"),
      bidAmount: 500_000,
    });

    expect(result.currentAuction?.consecutivePasses).toBe(0);
    expect(result.currentAuction?.highestBid).toBe(500_000);
    expect(result.currentAuction?.highestBidderId).toBe(toPlayerId("p1"));
  });

  it("allows bidding more than the player holds (overbidding is legal; the penalty comes at settlement)", () => {
    // default players hold no vote cards at all
    const initialState = createTestAuctionGameState();

    const result = handlePlaceBid(initialState, {
      type: "PLACE_BID",
      playerId: toPlayerId("p1"),
      bidAmount: 500_000,
    });

    expect(result.currentAuction?.highestBid).toBe(500_000);
  });

  it("does not modify the original state", () => {
    const initialState = createTestAuctionGameState();

    handlePlaceBid(initialState, {
      type: "PLACE_BID",
      playerId: toPlayerId("p1"),
      bidAmount: 250_000,
    });

    // asserted against independently written values, not against initialState itself
    expect(initialState.currentAuction?.highestBid).toBe(0);
    expect(initialState.currentAuction?.highestBidderId).toBe(null);
    expect(initialState.currentAuction?.currentBidderId).toBe(toPlayerId("p1"));
  });

  it("is routed correctly through applyAction", () => {
    const initialState = createTestAuctionGameState();

    const result = applyAction(initialState, {
      type: "PLACE_BID",
      playerId: toPlayerId("p1"),
      bidAmount: 250_000,
    });

    expect(result.currentAuction?.highestBid).toBe(250_000);
  });

  it("throws if it is not the player's turn to bid", () => {
    // currentBidderId defaults to p1, so p2 is acting out of turn
    const initialState = createTestAuctionGameState();

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p2"),
        bidAmount: 250_000,
      })
    ).toThrow("It is not this player's turn to bid");
  });

  it("throws if the opening bid is below the 250,000 minimum", () => {
    const initialState = createTestAuctionGameState();

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p1"),
        bidAmount: 100_000,
      })
    ).toThrow("Opening bid must be at least");
  });

  it("throws if the bid only matches the current highest bid", () => {
    const initialState = createTestAuctionGameState({
      currentAuction: createTestAuctionState({
        highestBid: 300_000,
        highestBidderId: toPlayerId("p2"),
        currentBidderId: toPlayerId("p1"),
      }),
    });

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p1"),
        bidAmount: 300_000,
      })
    ).toThrow("Bid must exceed the current highest bid");
  });

  it("throws if the game is not in the AUCTION phase", () => {
    const initialState = createTestState({
      phaseStack: ["TURN_START"],
    });

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p1"),
        bidAmount: 250_000,
      })
    ).toThrow("Cannot place bid outside of AUCTION phase");
  });

  it("throws if there is no active auction", () => {
    const initialState = createTestState({
      phaseStack: ["AUCTION"],
      currentAuction: null,
    });

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p1"),
        bidAmount: 250_000,
      })
    ).toThrow("No active auction to place a bid in");
  });
});

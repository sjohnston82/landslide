// src/lib/engine/reducer.test.ts
import { describe, expect, it } from "vitest";

import { applyAction, handleRollDie, handlePlaceBid } from "./reducer";
import { toPlayerId, toVoteCardId, type GameState } from "./types";
import {
  createTestState,
  createTestAuctionGameState,
  createTestAuctionState,
  createTestPlayer,
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

function createAffordableBidState(
  overrides: Partial<GameState> = {}
): GameState {
  return createTestAuctionGameState({
    voteCardsById: {
      [toVoteCardId("v1")]: { id: toVoteCardId("v1"), value: 200 },
    },
    players: [
      createTestPlayer({
        id: toPlayerId("p1"),
        voteHand: [toVoteCardId("v1")],
      }),
      createTestPlayer({ id: toPlayerId("p2") }),
    ],
    ...overrides,
  });
}

describe("handlePlaceBid", () => {
  it("updates the highest bid and highest bidder, leaving activeBidderIds untouched", () => {
    const initialState = createAffordableBidState();

    const result = handlePlaceBid(initialState, {
      type: "PLACE_BID",
      playerId: toPlayerId("p1"),
      bidAmount: 150,
    });

    expect(result.currentAuction?.highestBid).toBe(150);
    expect(result.currentAuction?.highestBidderId).toBe(toPlayerId("p1"));
    expect(result.currentAuction?.activeBidderIds).toEqual([
      toPlayerId("p1"),
      toPlayerId("p2"),
    ]);
  });

  it("does not modify the original state", () => {
    const initialState = createAffordableBidState();

    handlePlaceBid(initialState, {
      type: "PLACE_BID",
      playerId: toPlayerId("p1"),
      bidAmount: 150,
    });

    expect(initialState.currentAuction?.highestBid).toBe(100);
    expect(initialState.currentAuction?.highestBidderId).toBe(null);
  });

  it("is routed correctly through applyAction", () => {
    const initialState = createAffordableBidState();

    const result = applyAction(initialState, {
      type: "PLACE_BID",
      playerId: toPlayerId("p1"),
      bidAmount: 150,
    });

    expect(result.currentAuction?.highestBid).toBe(150);
  });

  it("throws if the bid exceeds the player's available votes", () => {
    const initialState = createAffordableBidState();

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p1"),
        bidAmount: 250,
      })
    ).toThrow("Bid amount exceeds player's available votes");
  });

  it("throws if the bid does not exceed the current highest bid", () => {
    const initialState = createAffordableBidState({
      currentAuction: createTestAuctionState({
        highestBid: 150,
        highestBidderId: toPlayerId("p2"),
      }),
    });

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p1"),
        bidAmount: 100,
      })
    ).toThrow("Bid must exceed the current highest bid");
  });

  it("throws if the player is not an active bidder", () => {
    const initialState = createAffordableBidState({
      currentAuction: createTestAuctionState({
        activeBidderIds: [toPlayerId("p2")],
      }),
    });

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p1"),
        bidAmount: 150,
      })
    ).toThrow("Player is not an active bidder in this auction");
  });

  it("throws if the game is not in the AUCTION phase", () => {
    const initialState = createTestState({
      phaseStack: ["TURN_START"],
    });

    expect(() =>
      handlePlaceBid(initialState, {
        type: "PLACE_BID",
        playerId: toPlayerId("p1"),
        bidAmount: 150,
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
        bidAmount: 150,
      })
    ).toThrow("No active auction to place a bid in");
  });
});

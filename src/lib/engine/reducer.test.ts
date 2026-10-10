// src/lib/engine/reducer.test.ts
import { describe, expect, it } from "vitest";

import {
  applyAction,
  handleRollDie,
  handlePlaceBid,
  handlePassAuction,
} from "./reducer";
import type { AuctionState, GameState } from "./types";
import { toPlayerId } from "./types";
import {
  createTestState,
  createTestAuctionGameState,
  createTestAuctionState,
  createTestPlayer,
} from "./test-helpers";
import { getCurrentPhase } from "./phase";

// Three players so the pass thresholds (N-1 with a bid, N without) are
// distinguishable from each other. The default fixture has only two.
function createThreePlayerAuctionState(
  auctionOverrides: Partial<AuctionState> = {}
): GameState {
  return createTestAuctionGameState({
    players: [
      createTestPlayer({ id: toPlayerId("p1") }),
      createTestPlayer({ id: toPlayerId("p2"), name: "Player Two" }),
      createTestPlayer({ id: toPlayerId("p3"), name: "Player Three" }),
    ],
    currentAuction: createTestAuctionState(auctionOverrides),
  });
}

// DICE ROLL TESTS

describe("handleRollDie", () => {
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

describe("handlePassAuction", () => {
  it("advances the turn and counts the pass", () => {
    const initialState = createThreePlayerAuctionState();

    const result = handlePassAuction(initialState, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p1"),
    });

    expect(result.currentAuction?.consecutivePasses).toBe(1);
    expect(result.currentAuction?.currentBidderId).toBe(toPlayerId("p2"));
    expect(getCurrentPhase(result)).toBe("AUCTION");
  });

  it("does not end the auction after 2 passes when nobody has bid (3 players)", () => {
    // p3 has not had a turn yet, so the auction must still be running
    const initialState = createThreePlayerAuctionState();
    const afterP1Pass = handlePassAuction(initialState, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p1"),
    });
    const afterP2Pass = handlePassAuction(afterP1Pass, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p2"),
    });

    expect(afterP2Pass.currentAuction?.consecutivePasses).toBe(2);
    expect(afterP2Pass.currentAuction?.currentBidderId).toBe(toPlayerId("p3"));
    expect(getCurrentPhase(afterP2Pass)).toBe("AUCTION");
  });

  it("ends a no-bid auction after all 3 players pass", () => {
    const initialState = createThreePlayerAuctionState();
    const afterP1Pass = handlePassAuction(initialState, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p1"),
    });
    const afterP2Pass = handlePassAuction(afterP1Pass, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p2"),
    });
    const afterP3Pass = handlePassAuction(afterP2Pass, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p3"),
    });

    expect(afterP3Pass.currentAuction).toBeNull();
    expect(getCurrentPhase(afterP3Pass)).toBe("TURN_END");
    // replacePhase, not pushPhase: nothing should be left underneath
    expect(afterP3Pass.phaseStack).toEqual(["TURN_END"]);
  });

  it("ends the auction after 2 passes when someone has bid (3 players)", () => {
    // p1 is the high bidder, so only p2 and p3 need to concede
    const initialState = createThreePlayerAuctionState({
      highestBid: 250_000,
      highestBidderId: toPlayerId("p1"),
      currentBidderId: toPlayerId("p2"),
    });
    const afterP2Pass = handlePassAuction(initialState, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p2"),
    });
    const afterP3Pass = handlePassAuction(afterP2Pass, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p3"),
    });

    expect(getCurrentPhase(afterP3Pass)).toBe("AUCTION_SETTLEMENT");
    // settlement needs the winner and the amount, so the auction must survive
    expect(afterP3Pass.currentAuction).not.toBeNull();
    expect(afterP3Pass.currentAuction?.highestBidderId).toBe(toPlayerId("p1"));
    expect(afterP3Pass.currentAuction?.highestBid).toBe(250_000);
    expect(afterP3Pass.phaseStack).toEqual(["AUCTION_SETTLEMENT"]);
  });

  it("does not modify the original state", () => {
    const initialState = createThreePlayerAuctionState();

    handlePassAuction(initialState, {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p1"),
    });

    expect(initialState.currentAuction?.consecutivePasses).toBe(0);
    expect(initialState.currentAuction?.currentBidderId).toBe(toPlayerId("p1"));
  });

  it("is routed correctly through applyAction", () => {
    const result = applyAction(createThreePlayerAuctionState(), {
      type: "PASS_AUCTION",
      playerId: toPlayerId("p1"),
    });

    expect(result.currentAuction?.consecutivePasses).toBe(1);
  });

  it("throws if the game is not in the AUCTION phase", () => {
    const initialState = createTestState({ phaseStack: ["TURN_START"] });

    expect(() =>
      handlePassAuction(initialState, {
        type: "PASS_AUCTION",
        playerId: toPlayerId("p1"),
      })
    ).toThrow("Cannot pass: game is not in the AUCTION phase");
  });

  it("throws if there is no active auction", () => {
    const initialState = createTestState({
      phaseStack: ["AUCTION"],
      currentAuction: null,
    });

    expect(() =>
      handlePassAuction(initialState, {
        type: "PASS_AUCTION",
        playerId: toPlayerId("p1"),
      })
    ).toThrow("Cannot pass: there is no active auction");
  });

  it("throws if it is not the player's turn to pass", () => {
    // currentBidderId defaults to p1, so p2 is acting out of turn
    const initialState = createThreePlayerAuctionState();

    expect(() =>
      handlePassAuction(initialState, {
        type: "PASS_AUCTION",
        playerId: toPlayerId("p2"),
      })
    ).toThrow("Cannot pass: it is not this player's turn to bid");
  });
});

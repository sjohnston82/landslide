import { POPULAR_VOTES_PER_ELECTORAL_VOTE } from "./constants";
import type { GameState, PlayerId } from "./types";

export function getPlayerVoteTotal(
  state: GameState,
  playerId: PlayerId
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error(`Player with ID ${playerId} not found`);
  }

  const voteTotal = player.voteHand.reduce((total, voteCardId) => {
    const voteCard = state.voteCardsById[voteCardId];

    if (!voteCard) {
      throw new Error(`Vote card with ID ${voteCardId} not found`);
    }

    return total + voteCard.value;
  }, 0);

  return voteTotal;
}

export function getNextPlayerId(
  state: GameState,
  currentPlayerId: PlayerId
): PlayerId {
  const currentIndex = state.players.findIndex((p) => p.id === currentPlayerId);

  if (currentIndex === -1) {
    throw new Error(`Player with ID ${currentPlayerId} not found`);
  }

  const nextIndex = (currentIndex + 1) % state.players.length;
  return state.players[nextIndex].id;
}


export function getPlayerSpendingPower(
  state: GameState,
  playerId: PlayerId
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error(`Player with ID ${playerId} not found`);
  }

  const voteTotal = getPlayerVoteTotal(state, playerId);
  const stateTotal = player.wonStates.reduce((total, stateId) => {
    const stateCard = state.stateCardsById[stateId];
    if (!stateCard) {
      throw new Error(`State with ID ${stateId} not found`);
    }
    return total + stateCard.electoralVotes * POPULAR_VOTES_PER_ELECTORAL_VOTE;
  }, 0);

  return voteTotal + stateTotal;
}
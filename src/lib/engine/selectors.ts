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

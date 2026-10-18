import { GameState, StateCardId } from "./types";

export type Shuffle = <T>(items: readonly T[]) => T[];

export const shuffle: Shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function returnStateToDeck(
  state: GameState,
  stateCardId: StateCardId,
  shuffleFn: Shuffle = shuffle
): GameState {
  const stateCard = state.stateCardsById[stateCardId];
  if (!stateCard) {
    throw new Error(
      `State card with ID ${stateCardId} not found in game state.`
    );
  }

  const alreadyInDeck = Object.values(state.stateDecks).some((deck) =>
    deck.includes(stateCardId)
  );
  if (alreadyInDeck) {
    throw new Error(`State card ${stateCardId} is already in a deck`);
  }
  const newDeck = shuffleFn([
    ...state.stateDecks[stateCard.region],
    stateCardId,
  ]);

  return {
    ...state,
    stateDecks: {
      ...state.stateDecks,
      [stateCard.region]: newDeck,
    },
  };
}

// GameAction info

import type { PlayerId, StateCardId, PoliticsCardId } from "./types";

export type GameAction =
  | {
      type: "ROLL_DIE";
      playerId: PlayerId;
    }
  | {
      type: "PLAY_POLITICS_CARD";
      playerId: PlayerId;
      cardId: PoliticsCardId;
      cardEffect:
        | {
            type: "DEBATE";
            opponentId: PlayerId;
          }
        | {
            type: "GAMBLE";
            stateId: StateCardId;
          }
        | {
            type: "NONE";
          };
    }
  | {
      type: "PLACE_BID";
      playerId: PlayerId;
      bidAmount: number;
    }
  | {
      type: "PASS_AUCTION";
      playerId: PlayerId;
    }
  | {
      type: "SELECT_OPEN_BALLOT_STATE";
      playerId: PlayerId;
      selectedState: StateCardId;
    };

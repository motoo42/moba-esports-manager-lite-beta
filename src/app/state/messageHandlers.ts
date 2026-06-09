import {
  markAllCareerMessagesRead,
  markCareerMessageRead,
} from "../../domain/messages";
import type { GameAction } from "./gameActions";
import type { GameState } from "./gameState";

type MessageAction = Extract<
  GameAction,
  { type: "mark-message-read" | "mark-all-messages-read" }
>;

export function handleMessageAction(
  state: GameState,
  action: MessageAction,
): GameState {
  if (!state.career) {
    return state;
  }

  if (action.type === "mark-all-messages-read") {
    return {
      ...state,
      career: markAllCareerMessagesRead(state.career),
    };
  }

  return {
    ...state,
    career: markCareerMessageRead(state.career, action.messageId),
  };
}

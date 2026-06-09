import { useGameDispatch, useGameSelector } from "../app/GameProvider";
import { gameActions } from "../app/state";
import { Inbox } from "../features/inbox";
import { CareerRequiredFallback } from "./CareerRequiredFallback";

export function InboxPage() {
  const career = useGameSelector((state) => state.career);
  const dispatch = useGameDispatch();

  if (!career) {
    return <CareerRequiredFallback title="메시지함을 열 수 없습니다" />;
  }

  return (
    <Inbox
      career={career}
      onMarkAllRead={() => dispatch(gameActions.markAllMessagesRead())}
      onMarkRead={(messageId) => dispatch(gameActions.markMessageRead(messageId))}
    />
  );
}

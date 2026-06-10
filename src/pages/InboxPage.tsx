import { useGameDispatch, useGameSelector } from "../app/GameProvider";
import type { InboxSubPage } from "../app/routes";
import { gameActions } from "../app/state";
import { Inbox } from "../features/inbox";
import { CareerRequiredFallback } from "./CareerRequiredFallback";

type InboxPageProps = {
  subPage?: InboxSubPage | null;
  onSubPageChange: (subPage: InboxSubPage) => void;
};

export function InboxPage({ subPage, onSubPageChange }: InboxPageProps) {
  const career = useGameSelector((state) => state.career);
  const dispatch = useGameDispatch();

  if (!career) {
    return <CareerRequiredFallback title="메시지함을 열 수 없습니다" />;
  }

  return (
    <Inbox
      career={career}
      subPage={subPage}
      onMarkAllRead={() => dispatch(gameActions.markAllMessagesRead())}
      onMarkRead={(messageId) => dispatch(gameActions.markMessageRead(messageId))}
      onSubPageChange={onSubPageChange}
    />
  );
}

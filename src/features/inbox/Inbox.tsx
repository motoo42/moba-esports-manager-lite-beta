import { useEffect, useMemo, useState } from "react";
import type { InboxSubPage } from "../../app/routes";
import {
  careerMessageCategoryLabels,
  careerMessagePriorityLabels,
  careerMessageSourceLabels,
  isImportantCareerMessage,
} from "../../domain/messages";
import { Button } from "../../shared/ui/Button";
import type { CareerMessage, CareerSave } from "../../types/game";

type InboxFilter = InboxSubPage;

type InboxProps = {
  career: CareerSave;
  subPage?: InboxSubPage | null;
  onMarkAllRead: () => void;
  onMarkRead: (messageId: string) => void;
  onSubPageChange: (subPage: InboxSubPage) => void;
};

const filterOptions: Array<{ id: InboxFilter; label: string }> = [
  { id: "all", label: "전체" },
  { id: "important", label: "중요" },
  { id: "schedule", label: "일정" },
  { id: "transfer", label: "이적" },
];

function sortMessages(messages: CareerMessage[]) {
  return [...messages].sort((left, right) => {
    const turnDiff = right.createdTurn - left.createdTurn;

    if (turnDiff !== 0) {
      return turnDiff;
    }

    return right.id.localeCompare(left.id);
  });
}

function getFilteredMessages(messages: CareerMessage[], filter: InboxFilter) {
  const sortedMessages = sortMessages(messages);

  if (filter === "all") {
    return sortedMessages;
  }

  if (filter === "important") {
    return sortedMessages.filter(isImportantCareerMessage);
  }

  return sortedMessages.filter((message) => message.category === filter);
}

function getPriorityClass(message: CareerMessage) {
  if (message.priority === "urgent") {
    return "inbox-priority-urgent";
  }

  if (message.priority === "important") {
    return "inbox-priority-important";
  }

  return "inbox-priority-normal";
}

function getUnreadCount(messages: CareerMessage[]) {
  return messages.filter((message) => !message.read).length;
}

function getFilterCount(messages: CareerMessage[], filter: InboxFilter) {
  if (filter === "all") {
    return messages.length;
  }

  if (filter === "important") {
    return messages.filter(isImportantCareerMessage).length;
  }

  return messages.filter((message) => message.category === filter).length;
}

function MessageDetail({ message }: { message: CareerMessage | undefined }) {
  if (!message) {
    return (
      <section className="inbox-detail inbox-detail-empty">
        <p className="eyebrow">Message detail</p>
        <h2>선택된 메시지가 없습니다</h2>
        <p>왼쪽 목록에서 메시지를 선택하면 상세 내용이 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section className="inbox-detail">
      <div className="inbox-detail-header">
        <div>
          <p className="eyebrow">
            {careerMessageCategoryLabels[message.category]} ·{" "}
            {careerMessageSourceLabels[message.source]}
          </p>
          <h2>{message.title}</h2>
          <span>{message.dateLabel}</span>
        </div>
        <span className={`inbox-priority-chip ${getPriorityClass(message)}`}>
          {careerMessagePriorityLabels[message.priority]}
        </span>
      </div>
      <p>{message.body}</p>
      <dl className="inbox-detail-meta">
        <div>
          <dt>상태</dt>
          <dd>{message.read ? "읽음" : "읽지 않음"}</dd>
        </div>
        {message.relatedCompetitionId && (
          <div>
            <dt>관련 대회</dt>
            <dd>{message.relatedCompetitionId}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export function Inbox({
  career,
  onMarkAllRead,
  onMarkRead,
  onSubPageChange,
  subPage,
}: InboxProps) {
  const activeFilter = subPage ?? "all";
  const messages = career.messages ?? [];
  const filteredMessages = useMemo(
    () => getFilteredMessages(messages, activeFilter),
    [activeFilter, messages],
  );
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    filteredMessages[0]?.id ?? null,
  );
  const selectedMessage =
    filteredMessages.find((message) => message.id === selectedMessageId) ??
    filteredMessages[0];
  const unreadCount = getUnreadCount(messages);

  useEffect(() => {
    setSelectedMessageId(null);
  }, [activeFilter]);

  function handleSelectMessage(message: CareerMessage) {
    setSelectedMessageId(message.id);

    if (!message.read) {
      onMarkRead(message.id);
    }
  }

  return (
    <section className="inbox-page">
      <div className="inbox-hero">
        <div>
          <p className="eyebrow">Club inbox</p>
          <h1>메시지함</h1>
          <p>
            일정, 경기 결과, 선수 상태, 스토브리그 소식처럼 지금 확인해야 할
            정보를 모아둡니다.
          </p>
        </div>
        <div className="inbox-hero-actions">
          <span>
            읽지 않음 <strong>{unreadCount}</strong>
          </span>
          <Button disabled={unreadCount === 0} variant="ghost" onClick={onMarkAllRead}>
            모두 읽음
          </Button>
        </div>
      </div>

      <div className="inbox-filter-row" role="tablist" aria-label="메시지 필터">
        {filterOptions.map((filter) => (
          <button
            aria-selected={activeFilter === filter.id}
            className={`inbox-filter-button ${
              activeFilter === filter.id ? "inbox-filter-button-active" : ""
            }`}
            key={filter.id}
            onClick={() => {
              onSubPageChange(filter.id);
            }}
            role="tab"
            type="button"
          >
            <span>{filter.label}</span>
            <strong>{getFilterCount(messages, filter.id)}</strong>
          </button>
        ))}
      </div>

      <div className="inbox-layout">
        <section className="inbox-list" aria-label="메시지 목록">
          {filteredMessages.length === 0 ? (
            <div className="inbox-empty">
              <strong>표시할 메시지가 없습니다.</strong>
              <span>날짜를 진행하면 중요한 소식이 이곳에 쌓입니다.</span>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <button
                className={`inbox-message-item ${
                  selectedMessage?.id === message.id ? "inbox-message-item-active" : ""
                } ${!message.read ? "inbox-message-item-unread" : ""}`}
                key={message.id}
                onClick={() => handleSelectMessage(message)}
                type="button"
              >
                <span className={`inbox-priority-dot ${getPriorityClass(message)}`} />
                <span>
                  <strong>{message.title}</strong>
                  <small>
                    {careerMessageCategoryLabels[message.category]} ·{" "}
                    {message.dateLabel}
                  </small>
                </span>
              </button>
            ))
          )}
        </section>
        <MessageDetail message={selectedMessage} />
      </div>
    </section>
  );
}

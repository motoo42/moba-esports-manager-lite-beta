import { useEffect, useMemo, useRef, type Dispatch } from "react";
import {
  createAiNewsFactsForMessage,
  isAiNewsCandidateMessage,
} from "../../domain/messages";
import type { AppSettings } from "../../domain/settings/appSettings";
import { generateAiNews } from "../../services/aiNewsApi";
import type { CareerMessage, CareerSave } from "../../types/game";
import { gameActions, type GameAction } from "../state";

function compareMessagesByCreatedTurn(
  left: CareerMessage,
  right: CareerMessage,
) {
  const turnDiff = right.createdTurn - left.createdTurn;

  if (turnDiff !== 0) {
    return turnDiff;
  }

  return right.id.localeCompare(left.id);
}

export function useAiNewsPipeline({
  appSettings,
  career,
  dispatch,
}: {
  appSettings: AppSettings;
  career: CareerSave | null;
  dispatch: Dispatch<GameAction>;
}) {
  const attemptedMessageIdsRef = useRef(new Set<string>());
  const latestCandidate = useMemo(() => {
    if (!career || !appSettings.messageNews.aiNewsEnabled) {
      return null;
    }

    return [...(career.messages ?? [])]
      .filter(isAiNewsCandidateMessage)
      .filter((message) => !attemptedMessageIdsRef.current.has(message.id))
      .sort(compareMessagesByCreatedTurn)[0];
  }, [appSettings.messageNews.aiNewsEnabled, career]);

  useEffect(() => {
    if (!career || !latestCandidate || !appSettings.messageNews.aiNewsEnabled) {
      return;
    }

    const facts = createAiNewsFactsForMessage({
      career,
      message: latestCandidate,
    });

    if (!facts) {
      attemptedMessageIdsRef.current.add(latestCandidate.id);
      return;
    }

    let cancelled = false;

    attemptedMessageIdsRef.current.add(latestCandidate.id);

    void generateAiNews(facts)
      .then((news) => {
        if (cancelled) {
          return;
        }

        dispatch(
          gameActions.applyAiNewsMessage({
            body: news.body,
            messageId: latestCandidate.id,
            title: news.title,
          }),
        );
      })
      .catch(() => {
        // AI news is an optional enrichment layer. Keep the template message.
      });

    return () => {
      cancelled = true;
    };
  }, [
    appSettings.messageNews.aiNewsEnabled,
    career,
    dispatch,
    latestCandidate,
  ]);
}

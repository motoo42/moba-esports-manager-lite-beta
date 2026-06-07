import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useContext,
  useMemo,
  useReducer,
} from "react";
import {
  gameReducer,
  initialGameState,
  type GameAction,
  type GameState,
} from "./gameReducer";

type GameContextValue = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);

  if (!value) {
    throw new Error("useGame must be used inside GameProvider.");
  }

  return value;
}

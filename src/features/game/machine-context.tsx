import { createActorContext } from '@xstate/react'
import { gameMachine } from './machine'
import { useSettings } from './store/settings'

const GameContext = createActorContext(gameMachine)

export const useGameSelector = GameContext.useSelector
export const useGameActorRef = GameContext.useActorRef

type Props = {
  children: React.ReactNode
}

export function GameMachineProvider({ children }: Props) {
  // Read once at mount — the persisted difficulty seeds the first game only.
  const difficulty = useSettings.getState().difficulty

  return (
    <GameContext.Provider options={{ input: { difficulty } }}>
      {children}
    </GameContext.Provider>
  )
}

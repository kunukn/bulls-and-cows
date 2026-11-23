import { dailyGameInput } from "@/features/daily/daily";
import { TIP_KEYS } from "@/features/game/bullLines";
import { paletteFor } from "@/features/game/logic";
import type { gameMachine } from "@/features/game/machine";
import {
  GameActorProvider,
  useGameActorRef,
} from "@/features/game/machine-context";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { i18n } from "@/i18n";
import { MemoryRouter } from "react-router";
import type { ActorRefFrom } from "xstate";
import { BullBubble } from "./BullBubble";

type GameActor = ActorRefFrom<typeof gameMachine>;

function renderShieldBull() {
  let actor: GameActor | undefined;
  function GrabActor() {
    actor = useGameActorRef();

    return null;
  }
  render(
    <MemoryRouter>
      <GameActorProvider options={{ input: { difficulty: "classic" } }}>
        <GrabActor />
        <BullBubble variant="shield" hasNewHint={false} />
      </GameActorProvider>
    </MemoryRouter>,
  );
  if (!actor) throw new Error("No game actor");

  fireEvent.click(screen.getByRole("button", { name: "Hint" }));
  expect(screen.getByRole("dialog", { name: "Tyr says" })).toBeVisible();

  return actor;
}

beforeEach(() => {
  localStorage.clear();
});

describe("shield bull bubble", () => {
  it("closes on a new game: its line was about the old one", () => {
    const actor = renderShieldBull();

    act(() => actor.send({ type: "NEW_GAME" }));

    expect(screen.queryByRole("dialog", { name: "Tyr says" })).toBeNull();
  });

  it("stays open while the same game goes on", () => {
    const actor = renderShieldBull();
    const [color] = paletteFor("classic");

    act(() => actor.send({ type: "ADD_PEG", color }));

    expect(screen.getByRole("dialog", { name: "Tyr says" })).toBeVisible();
  });
});

describe("shield bull bubble on the daily code", () => {
  it("offers to talk about the day instead of a hint", () => {
    render(
      <MemoryRouter>
        <GameActorProvider options={{ input: dailyGameInput(1) }}>
          <BullBubble variant="shield" hasNewHint={false} />
        </GameActorProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "Hint" })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Ask Tyr about today's code" }),
    );

    // Before the first guess a practice game gives tips; the daily code never.
    const tips = TIP_KEYS.map((key) => i18n.t(key));
    const bubble = screen.getByRole("dialog", { name: "Tyr says" });
    expect(tips).not.toContain(bubble.textContent);
  });
});

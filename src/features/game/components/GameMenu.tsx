import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGameActorRef } from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { ChevronDown, Flag, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

// 44px rows on touch screens (Apple's minimum target); mouse keeps it compact.
const touchItemClass = "pointer-coarse:py-3";

/*
 * Lives in the info row above the board, away from Check, so a missed tap on
 * the main action can't land on it. Opening the menu is the deliberate first
 * step, so its items act without a further confirm dialog.
 */
export function GameMenu() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const isMinimalText = useSettings((state) => state.isMinimalText);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={isMinimalText ? t("game.giveUp") : undefined}
        className="-my-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-card data-[state=open]:text-foreground"
      >
        <Flag className="size-3.5" />
        <span className={isMinimalText ? "sr-only" : undefined}>
          {t("game.giveUp")}
        </span>
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        {/* New game first: the item that keeps the code secret is the easy reach. */}
        <DropdownMenuItem
          onSelect={() => actor.send({ type: "NEW_GAME" })}
          className={touchItemClass}
        >
          <RotateCcw />
          {t("result.newGame")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="pointer-coarse:my-2" />
        {/* Red marks the item that ends the game and reveals the code. */}
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => actor.send({ type: "GIVE_UP" })}
          className={touchItemClass}
        >
          <Flag />
          {t("game.giveUp")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

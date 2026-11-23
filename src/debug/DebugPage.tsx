import { paths } from "@/app/paths";
import { Link } from "react-router";

/*
 * Developer index, unlinked: one place to find every debug page and tool.
 * Copy is English only on purpose (see copilot-instructions.md).
 */

const linkClass =
  "font-semibold text-heading underline underline-offset-4 hover:text-foreground";

export function DebugPage() {
  return (
    <div className="flex flex-col gap-6 pb-12">
      <meta name="robots" content="noindex" />
      <h2 className="text-2xl font-bold tracking-tight text-heading">Debug</h2>
      <ul className="flex flex-col gap-4">
        <li className="flex flex-col gap-0.5">
          <Link to={paths.debugBullLines} className={linkClass}>
            Bull lines
          </Link>
          <span className="text-sm text-subtle">
            Every line the header and shield bulls can say, in the active
            language.
          </span>
        </li>
        <li className="flex flex-col gap-0.5">
          <Link to={paths.debugShare} className={linkClass}>
            Share preview
          </Link>
          <span className="text-sm text-subtle">
            A finished daily game with made-up guesses, to try Share, X, Threads
            and Bluesky without using up today's code.
          </span>
        </li>
        <li className="flex flex-col gap-0.5">
          {/*
           * A full page load, not a <Link>: main.tsx checks for the flag only
           * at startup. It matches anywhere in the URL, so this works with
           * hash routing too.
           */}
          <a
            href={`${import.meta.env.BASE_URL}?debug_rainbow=1`}
            className={linkClass}
          >
            Rainbow outlines
          </a>
          <span className="text-sm text-subtle">
            Reloads the game with every element outlined. Alt+Shift+R toggles
            it.
          </span>
        </li>
      </ul>
    </div>
  );
}

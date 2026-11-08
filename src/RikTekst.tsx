import { Fragment } from "react";

/** Renders `**bold**` as <strong> and `*italic*` as <em>; no HTML is parsed. */
export default function RikTekst({ tekst }: { tekst: string }) {
  // One span keeps the text a single flex item next to icons
  return (
    <span>
      {tekst.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((del, i) => {
        if (del.startsWith("**") && del.endsWith("**") && del.length > 4) return <strong key={i}>{del.slice(2, -2)}</strong>;
        if (del.startsWith("*") && del.endsWith("*") && del.length > 2) return <em key={i}>{del.slice(1, -1)}</em>;
        return <Fragment key={i}>{del}</Fragment>;
      })}
    </span>
  );
}

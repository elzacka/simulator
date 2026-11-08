type Tema = "light" | "dark";

// Heroicons 24 outline (MIT, Tailwind Labs)
const MOON = "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z";
const SUN = "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z";

export default function ThemeToggle({ tema, bytt }: { tema: Tema; bytt: () => void }) {
  const tilMork = tema === "light";
  return (
    <button
      className="btn-ghost"
      onClick={bytt}
      aria-label={tilMork ? "Bytt til mørkt tema" : "Bytt til lyst tema"}
      style={{
        border: "1px solid var(--line)", background: "transparent", color: "var(--ink-2)",
        padding: "6px", borderRadius: "var(--radius-sm)", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={tilMork ? MOON : SUN} />
      </svg>
    </button>
  );
}

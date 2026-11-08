import Icon from "./Icon";

type Tema = "light" | "dark";

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
      <Icon name={tilMork ? "dark_mode" : "light_mode"} size={18} ariaLabel="" />
    </button>
  );
}

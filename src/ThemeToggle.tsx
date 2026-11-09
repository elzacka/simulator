import Icon from "./Icon";

type Tema = "light" | "dark";

export default function ThemeToggle({ tema, bytt }: { tema: Tema; bytt: () => void }) {
  const tilMork = tema === "light";
  return (
    <button
      className="btn btn-ghost btn-ikon"
      onClick={bytt}
      aria-label={tilMork ? "Bytt til mørkt tema" : "Bytt til lyst tema"}
    >
      <Icon name={tilMork ? "heroicons/outline/moon" : "heroicons/outline/sun"} size={18} />
    </button>
  );
}

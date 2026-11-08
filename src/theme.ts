import { useEffect, useState } from "react";

type Tema = "light" | "dark";

function lagret(): Tema | null {
  try {
    const v = localStorage.getItem("tema");
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function systemetsTema(): Tema {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [tema, setTema] = useState<Tema>(() => lagret() ?? systemetsTema());

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try {
      localStorage.setItem("tema", tema);
    } catch { /* privat modus e.l. */ }
  }, [tema]);

  return { tema, bytt: () => setTema(t => (t === "dark" ? "light" : "dark")) };
}

export type ThemeState = ReturnType<typeof useTheme>;

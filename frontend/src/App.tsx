import { useCallback, useEffect, useState } from "react";
import type { Langue } from "./api";
import { ChatWidget, type Demande } from "./components/ChatWidget";
import { Landing } from "./components/Landing";

function langueInitiale(): Langue {
  try {
    const memo = localStorage.getItem("langue");
    if (memo === "fr" || memo === "en" || memo === "ar") return memo;
  } catch {
    /* stockage indisponible */
  }
  const nav = navigator.language.slice(0, 2);
  return nav === "en" || nav === "ar" ? nav : "fr";
}

export default function App() {
  const [langue, setLangue] = useState<Langue>(langueInitiale);
  // #assistant dans l'URL ouvre directement le chat (lien partageable).
  const [chatOuvert, setChatOuvert] = useState(() => window.location.hash === "#assistant");
  const [demande, setDemande] = useState<Demande | null>(null);

  useEffect(() => {
    document.documentElement.lang = langue;
    document.documentElement.dir = langue === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("langue", langue);
    } catch {
      /* stockage indisponible */
    }
  }, [langue]);

  const ouvrirChat = useCallback((question?: string) => {
    setChatOuvert(true);
    if (question) setDemande({ id: Date.now(), question });
  }, []);

  return (
    <>
      <Landing langue={langue} setLangue={setLangue} ouvrirChat={ouvrirChat} />
      <ChatWidget langue={langue} ouvert={chatOuvert} setOuvert={setChatOuvert} demande={demande} />
    </>
  );
}

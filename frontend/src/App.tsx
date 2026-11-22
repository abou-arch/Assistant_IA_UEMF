import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { envoyerMessage, obtenirSuggestions, type ChatResponse, type Langue, type Suggestion } from "./api";
import { AssistantBubble } from "./components/AssistantBubble";
import { LANGUES, t } from "./i18n";

const MAX_CARACTERES = 500; // = MAX_QUESTION_CHARS côté rag/config.py
const DELAI_MS = 120_000; // un LLM local (Ollama) peut être lent

type Message =
  | { id: string; role: "user"; contenu: string }
  | { id: string; role: "assistant"; reponse: ChatResponse }
  | { id: string; role: "erreur"; question: string; detail: string };

function langueInitiale(): Langue {
  const memo = localStorage.getItem("langue");
  if (memo === "fr" || memo === "en" || memo === "ar") return memo;
  const nav = navigator.language.slice(0, 2);
  return nav === "en" || nav === "ar" ? nav : "fr";
}

export default function App() {
  const [langue, setLangue] = useState<Langue>(langueInitiale);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [saisie, setSaisie] = useState("");
  const [enAttente, setEnAttente] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const finRef = useRef<HTMLDivElement>(null);
  const champRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.lang = langue;
    document.documentElement.dir = langue === "ar" ? "rtl" : "ltr";
    localStorage.setItem("langue", langue);
    obtenirSuggestions(langue).then(setSuggestions).catch(() => setSuggestions([]));
  }, [langue]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, enAttente]);

  async function envoyer(question: string) {
    const texte = question.trim();
    if (!texte || enAttente) return;
    setSaisie("");
    setMessages((m) => [...m.filter((x) => !(x.role === "erreur" && x.question === texte)), { id: crypto.randomUUID(), role: "user", contenu: texte }]);
    setEnAttente(true);
    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), DELAI_MS);
    try {
      const reponse = await envoyerMessage(texte, langue, conversationId, controleur.signal);
      setConversationId(reponse.conversation_id);
      setMessages((m) => [...m, { id: reponse.message_id, role: "assistant", reponse }]);
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "erreur", question: texte, detail: e instanceof Error ? e.message : String(e) }]);
    } finally {
      clearTimeout(minuteur);
      setEnAttente(false);
      champRef.current?.focus();
    }
  }

  function surSoumission(e: FormEvent) {
    e.preventDefault();
    void envoyer(saisie);
  }

  function surTouche(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void envoyer(saisie);
    }
  }

  function nouvelleConversation() {
    setMessages([]);
    setConversationId(null);
    champRef.current?.focus();
  }

  return (
    <div className="app">
      <header className="entete">
        <h1>{t(langue, "titre")}</h1>
        <div className="actions">
          <select value={langue} onChange={(e) => setLangue(e.target.value as Langue)} aria-label="Langue / Language / اللغة">
            {LANGUES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.libelle}
              </option>
            ))}
          </select>
          <button type="button" className="secondaire" onClick={nouvelleConversation} disabled={messages.length === 0}>
            {t(langue, "nouvelle")}
          </button>
        </div>
      </header>

      <main className="fil" role="log" aria-live="polite">
        {messages.length === 0 && (
          <section className="accueil">
            <p>{t(langue, "sousTitre")}</p>
            {suggestions.length > 0 && (
              <>
                <h2>{t(langue, "suggestions")}</h2>
                <div className="suggestions">
                  {suggestions.map((s) => (
                    <button key={s.fiche_id} type="button" className="suggestion" onClick={() => envoyer(s.question)} dir="auto">
                      {s.question}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="bulle bulle-user" dir="auto">
              {m.contenu}
            </div>
          ) : m.role === "assistant" ? (
            <AssistantBubble key={m.id} reponse={m.reponse} langue={langue} />
          ) : (
            <div key={m.id} className="bulle bulle-erreur">
              <p>{t(langue, "erreur")}</p>
              <small dir="auto">{m.detail}</small>
              <button type="button" onClick={() => envoyer(m.question)} disabled={enAttente}>
                {t(langue, "reessayer")}
              </button>
            </div>
          ),
        )}

        {enAttente && <div className="bulle bulle-assistant reflexion">{t(langue, "reflexion")}</div>}
        <div ref={finRef} />
      </main>

      <form className="saisie" onSubmit={surSoumission}>
        <textarea
          ref={champRef}
          value={saisie}
          onChange={(e) => setSaisie(e.target.value.slice(0, MAX_CARACTERES))}
          onKeyDown={surTouche}
          placeholder={t(langue, "placeholder")}
          rows={2}
          dir="auto"
          autoFocus
        />
        <button type="submit" disabled={enAttente || !saisie.trim()}>
          {t(langue, "envoyer")}
        </button>
      </form>
      <p className="pied">{t(langue, "avertissement")}</p>
    </div>
  );
}

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { envoyerMessage, obtenirSuggestions, type ChatResponse, type Langue, type Suggestion } from "../api";
import { TEXTES } from "../i18n";
import { AssistantBubble } from "./AssistantBubble";

const MAX_CARACTERES = 500; // = MAX_QUESTION_CHARS côté rag/config.py
const DELAI_MS = 120_000; // un LLM local (Ollama) peut être lent

type Message =
  | { id: string; role: "user"; contenu: string }
  | { id: string; role: "assistant"; reponse: ChatResponse }
  | { id: string; role: "erreur"; question: string; detail: string };

export interface Demande {
  id: number;
  question?: string;
}

interface Props {
  langue: Langue;
  ouvert: boolean;
  setOuvert: (o: boolean) => void;
  demande: Demande | null; // question envoyée depuis la page (FAQ, filières…)
}

function IconeChat() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5v-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconeFermer() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ChatWidget({ langue, ouvert, setOuvert, demande }: Props) {
  const t = TEXTES[langue].chat;
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [saisie, setSaisie] = useState("");
  const [enAttente, setEnAttente] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [invitation, setInvitation] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const champRef = useRef<HTMLTextAreaElement>(null);
  const enAttenteRef = useRef(false);

  useEffect(() => {
    obtenirSuggestions(langue)
      .then((s) => setSuggestions(s.slice(0, 4)))
      .catch(() => setSuggestions([]));
  }, [langue]);

  // Petite bulle d'invitation après quelques secondes, une seule fois.
  useEffect(() => {
    const id = setTimeout(() => setInvitation(true), 6000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (ouvert) {
      setInvitation(false);
      setTimeout(() => champRef.current?.focus(), 250);
    }
  }, [ouvert]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, enAttente, ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert, setOuvert]);

  async function envoyer(question: string) {
    const texte = question.trim();
    if (!texte || enAttenteRef.current) return;
    enAttenteRef.current = true;
    setSaisie("");
    setMessages((m) => [
      ...m.filter((x) => !(x.role === "erreur" && x.question === texte)),
      { id: crypto.randomUUID(), role: "user", contenu: texte },
    ]);
    setEnAttente(true);
    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), DELAI_MS);
    try {
      const reponse = await envoyerMessage(texte, langue, conversationId, controleur.signal);
      setConversationId(reponse.conversation_id);
      setMessages((m) => [...m, { id: reponse.message_id, role: "assistant", reponse }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "erreur", question: texte, detail: e instanceof Error ? e.message : String(e) },
      ]);
    } finally {
      clearTimeout(minuteur);
      enAttenteRef.current = false;
      setEnAttente(false);
      champRef.current?.focus();
    }
  }

  // Question transmise par la page (clic sur une FAQ, une filière…).
  useEffect(() => {
    if (demande?.question) void envoyer(demande.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demande]);

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
    <>
      <section
        className={`chat-panneau ${ouvert ? "ouvert" : ""}`}
        role="dialog"
        aria-label={t.titre}
        aria-hidden={!ouvert}
        {...(ouvert ? {} : { inert: "" })}
      >
        <header className="chat-entete">
          <span className="chat-avatar" aria-hidden="true">
            <IconeChat />
          </span>
          <div className="chat-identite">
            <strong>{t.titre}</strong>
            <small>
              <span className="pastille" aria-hidden="true" /> {t.statut}
            </small>
          </div>
          <button type="button" className="chat-icone" onClick={nouvelleConversation} disabled={messages.length === 0} title={t.nouvelle} aria-label={t.nouvelle}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="chat-icone" onClick={() => setOuvert(false)} aria-label={t.fermer}>
            <IconeFermer />
          </button>
        </header>

        <div className="chat-fil" role="log" aria-live="polite">
          <div className="bulle bulle-assistant">{t.accueil}</div>
          {messages.length === 0 && suggestions.length > 0 && (
            <div className="chat-suggestions">
              <span className="libelle">{t.suggestions}</span>
              {suggestions.map((s) => (
                <button key={s.fiche_id} type="button" onClick={() => envoyer(s.question)} dir="auto">
                  {s.question}
                </button>
              ))}
            </div>
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
                <p>{t.erreur}</p>
                <small dir="auto">{m.detail}</small>
                <button type="button" onClick={() => envoyer(m.question)} disabled={enAttente}>
                  {t.reessayer}
                </button>
              </div>
            ),
          )}

          {enAttente && (
            <div className="bulle bulle-assistant reflexion" aria-label={t.reflexion}>
              <span className="points-saisie" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {t.reflexion}
            </div>
          )}
          <div ref={finRef} />
        </div>

        <form className="chat-saisie" onSubmit={surSoumission}>
          <textarea
            ref={champRef}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value.slice(0, MAX_CARACTERES))}
            onKeyDown={surTouche}
            placeholder={t.placeholder}
            rows={1}
            dir="auto"
            aria-label={t.placeholder}
          />
          <button type="submit" className="chat-envoyer" disabled={enAttente || !saisie.trim()} aria-label={t.envoyer}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <p className="chat-mention">{t.avertissement}</p>
      </section>

      {invitation && !ouvert && (
        <button type="button" className="chat-invitation" onClick={() => setOuvert(true)}>
          {t.bulleInvitation}
        </button>
      )}

      <button
        type="button"
        className={`chat-lanceur ${ouvert ? "ouvert" : ""}`}
        onClick={() => setOuvert(!ouvert)}
        aria-label={ouvert ? t.fermer : t.ouvrir}
        aria-expanded={ouvert}
      >
        {ouvert ? <IconeFermer /> : <IconeChat />}
      </button>
    </>
  );
}

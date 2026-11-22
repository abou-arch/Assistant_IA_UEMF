import type { ChatResponse, Langue } from "../api";
import { t } from "../i18n";

function lienContact(contact: string): string | null {
  if (contact.includes("@")) return `mailto:${contact.match(/[\w.+-]+@[\w.-]+/)?.[0] ?? contact}`;
  if (/^\+?[\d\s-]{6,}$/.test(contact)) return `tel:${contact.replace(/[\s-]/g, "")}`;
  return null;
}

export function AssistantBubble({ reponse, langue }: { reponse: ChatResponse; langue: Langue }) {
  const { orientation } = reponse;
  const href = orientation?.contact ? lienContact(orientation.contact) : null;

  return (
    <div className="bulle bulle-assistant" dir="auto">
      {reponse.a_confirmer && <p className="avertissement">⚠ {t(langue, "aConfirmer")}</p>}
      <p className="contenu">{reponse.contenu}</p>

      {reponse.validite && (
        <p className="validite">
          {t(langue, "validite")} <bdi dir="ltr">{reponse.validite}</bdi>
        </p>
      )}

      {reponse.sources.length > 0 && (
        <div className="sources">
          <span className="libelle">{t(langue, "sources")}</span>
          <ul>
            {reponse.sources.map((s) => (
              <li key={s.id}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.titre}
                  </a>
                ) : (
                  s.titre
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {orientation && (
        <div className="orientation">
          <span className="libelle">{t(langue, "orientation")}</span>
          <strong>{orientation.libelle}</strong>
          {orientation.contact &&
            (href ? (
              <a href={href} dir="ltr">
                {orientation.contact}
              </a>
            ) : (
              <span>{orientation.contact}</span>
            ))}
        </div>
      )}
    </div>
  );
}

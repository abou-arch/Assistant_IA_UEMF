// Types et appels conformes à docs/02-contrat-api.md
export type Langue = "fr" | "en" | "ar";

export interface Source {
  id: string;
  titre: string;
  url: string;
}

export interface Orientation {
  libelle: string;
  contact: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  langue: Langue;
  contenu: string;
  comportement: string;
  sources: Source[];
  orientation: Orientation | null;
  fiches_utilisees: string[];
  confiance: number;
  validite: string | null;
  a_confirmer: boolean;
  cree_le: string;
}

export interface Suggestion {
  fiche_id: string;
  categorie: string;
  question: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function requete<T>(chemin: string, init?: RequestInit): Promise<T> {
  const rep = await fetch(`/api${chemin}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!rep.ok) {
    const corps = await rep.json().catch(() => null);
    throw new ApiError(rep.status, corps?.erreur?.message ?? rep.statusText);
  }
  return rep.json() as Promise<T>;
}

export function obtenirSuggestions(langue: Langue) {
  return requete<Suggestion[]>(`/suggestions?langue=${langue}`);
}

export function envoyerMessage(message: string, langue: Langue, conversationId: string | null, signal?: AbortSignal) {
  return requete<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ conversation_id: conversationId, message, langue }),
    signal,
  });
}

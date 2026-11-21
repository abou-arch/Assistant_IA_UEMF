# Contrat d'API (front ↔ back)

Ce fichier est **la référence commune** des deux équipes. Toute modification se fait par pull request relue par un membre de chaque équipe. Le front s'appuie dessus pour ses mocks (MSW) ; le back-end le respecte et FastAPI en génère la version OpenAPI sur `http://localhost:8000/docs`.

- Préfixe : `/api`
- Format : JSON UTF-8, noms de champs en `snake_case`
- Dates : ISO 8601 UTC (`2026-11-21T10:15:00Z`)
- Langues : `"fr" | "en" | "ar"`

## Types communs

```ts
type Langue = "fr" | "en" | "ar";

type Comportement =
  | "repondre_citer"
  | "repondre_limite_orienter"
  | "non_publie_orienter"
  | "refus_perimetre"
  | "refus_orienter"
  | "presentation";

interface Source {
  id: string;      // "S01"
  titre: string;
  url: string;     // peut être "" si la source n'a pas d'URL
}

interface Orientation {
  libelle: string;        // "Service des admissions"
  contact: string | null; // "+212 5 38 90-3230" ou une adresse e-mail
}

interface Erreur {
  erreur: { code: string; message: string };
}
```

## Endpoints

### `GET /api/health`

```json
{ "statut": "ok", "fiches_indexees": 68, "version": "0.1.0" }
```

### `GET /api/categories`

```json
[
  { "nom": "Formations", "nb_fiches": 13 },
  { "nom": "Frais et paiement", "nb_fiches": 11 }
]
```

Les catégories *Tests de sécurité* et *Hors périmètre* ne sont **pas** renvoyées.

### `GET /api/suggestions?langue=fr&categorie=Admission&limite=6`

Renvoie des questions de la base à proposer en un clic (questions des fiches `repondre_citer`). Paramètres facultatifs.

```json
[
  { "fiche_id": "Q001", "categorie": "Présentation de l'EIDIA", "question": "Qu'est-ce que l'EIDIA ?" },
  { "fiche_id": "Q015", "categorie": "Frais et paiement", "question": "Quels sont les frais de scolarité ?" }
]
```

Le texte de `question` est dans la langue demandée (`question`, `question_en` ou `question_ar`).

### `POST /api/chat`

Requête :

```json
{
  "conversation_id": null,
  "message": "Combien coûte la première année ?",
  "langue": "fr"
}
```

| Champ | Règle |
|---|---|
| `conversation_id` | `null` pour démarrer ; sinon l'id renvoyé précédemment |
| `message` | 1 à 1 000 caractères après `trim()` |
| `langue` | langue de l'interface ; le back-end peut répondre dans la langue détectée de la question |

Réponse `200` :

```json
{
  "conversation_id": "c_01JD3K8Z7Q",
  "message_id": "m_01JD3K9A2B",
  "langue": "fr",
  "contenu": "Pour l'année 2026-2027, les frais de scolarité … \n\n- Inscription : …",
  "comportement": "repondre_citer",
  "sources": [
    { "id": "S11", "titre": "Tarification et réduction 2026-2027", "url": "https://ueuromed.org/fr/tarification-et-reduction" }
  ],
  "orientation": null,
  "fiches_utilisees": ["Q015"],
  "confiance": 0.86,
  "validite": "2026-2027",
  "a_confirmer": false,
  "cree_le": "2026-11-21T10:15:02Z"
}
```

| Champ | Usage côté front |
|---|---|
| `contenu` | Markdown simple (gras, listes, liens). À rendre **sans HTML brut**. |
| `comportement` | Choix du style : refus → bulle neutre + suggestions ; `*_orienter` → carte d'orientation mise en avant. |
| `sources` | Liste de liens « Sources officielles ». Vide pour un refus. |
| `orientation` | Carte « Contacter » si non nul. |
| `a_confirmer` | `true` si une fiche utilisée a le statut « Sourcé — à confirmer » → bandeau d'avertissement. |
| `validite` | Afficher « Information valable pour 2026-2027 ». |
| `confiance` | 0 à 1. Non affiché au visiteur ; utile en mode debug / admin. |

### `GET /api/conversations/{conversation_id}`

```json
{
  "id": "c_01JD3K8Z7Q",
  "langue": "fr",
  "cree_le": "2026-11-21T10:15:00Z",
  "messages": [
    { "id": "m_01", "role": "utilisateur", "contenu": "Combien coûte …", "cree_le": "…" },
    { "id": "m_02", "role": "assistant", "contenu": "Pour l'année …", "cree_le": "…",
      "comportement": "repondre_citer", "sources": [], "orientation": null,
      "a_confirmer": false, "validite": "2026-2027", "avis": "utile" }
  ]
}
```

`404` si la conversation n'existe pas (le front repart sur une conversation vide).

### `POST /api/messages/{message_id}/avis`

```json
{ "note": "pas_utile", "commentaire": "Le montant ne correspond pas au site." }
```

- `note` : `"utile" | "pas_utile"` ; `commentaire` : facultatif, ≤ 500 caractères.
- Réponse `204`. Un second envoi remplace le premier.
- `404` si le message n'existe pas ou n'est pas une réponse de l'assistant.

### Endpoints d'administration (V2)

Protégés par l'en-tête `X-Admin-Key: <ADMIN_API_KEY>`.

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/api/admin/reindexer` | Recharge le JSONL et reconstruit l'index → `{ "fiches_indexees": 68, "vecteurs": 272 }` |
| `GET` | `/api/admin/statistiques` | `{ "conversations": 120, "messages": 430, "avis_utiles": 80, "avis_pas_utiles": 12, "par_comportement": {...}, "latence_moyenne_ms": 1800 }` |
| `GET` | `/api/admin/avis?note=pas_utile&page=1` | Liste paginée des avis avec question et réponse associées |

## Erreurs

Toutes les erreurs suivent le format `Erreur`.

| HTTP | `code` | Quand | Réaction du front |
|---|---|---|---|
| 422 | `validation` | message vide / trop long, langue inconnue | Message sous le champ de saisie |
| 404 | `introuvable` | conversation ou message inconnu | Repartir à zéro / ignorer |
| 429 | `trop_de_requetes` | > 20 messages / minute / IP | Toast « Patientez un instant » |
| 503 | `llm_indisponible` | délai ou erreur du fournisseur LLM | Bulle en erreur + « Réessayer » |
| 500 | `interne` | autre | Bulle en erreur + « Réessayer » |

Un refus (hors périmètre, injection) n'est **pas** une erreur : c'est une réponse `200` avec `comportement = "refus_perimetre"`.

## Évolutions prévues (ne pas implémenter tout de suite)

- `POST /api/chat/stream` en Server-Sent Events : évènements `delta` (texte), puis `fin` (objet `ChatResponse` complet sans `contenu`).
- Authentification de l'espace admin (aujourd'hui : simple clé d'API).

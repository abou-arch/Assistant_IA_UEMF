# Documentation du prototype — Assistant IA EIDIA

## Vision

Un assistant conversationnel qui répond aux questions des candidats, étudiants et parents sur l'**EIDIA** (UEMF) — formations, admission, frais, bourses, vie étudiante, contacts — en **français, anglais et arabe**, en citant toujours les **sources officielles** et en orientant vers le bon service quand l'information n'est pas publiée.

La base de connaissances existe déjà : `base_QR_EIDIA.xlsx` → `base_QR_EIDIA.jsonl` (77 fiches, 14 catégories, dont 68 à indexer et 9 réservées à l'évaluation).

## Périmètre du prototype

| Inclus (V1) | Plus tard (V2) |
|---|---|
| Chat question / réponse avec sources | Réponse en streaming (SSE) |
| FR / EN / AR (RTL) | Espace admin complet avec authentification |
| Suggestions par catégorie | Intégration au site officiel (widget) |
| Orientation vers les services | Statistiques avancées |
| Refus hors périmètre et anti-injection | Mise à jour de la base depuis l'interface |
| Avis 👍 / 👎 | |
| Script d'évaluation sur les 77 fiches | |

## Sommaire

| Document | Pour qui |
|---|---|
| [UML — cas d'utilisation](uml/01-cas-utilisation.md) | Tous |
| [UML — classes et modèle de données](uml/02-classes.md) | Tous |
| [UML — séquences](uml/03-sequences.md) | Tous |
| [UML — activités et états](uml/04-activites-etats.md) | Tous (états du front : §3 et §4) |
| [UML — composants et déploiement](uml/05-composants-deploiement.md) | Tous |
| [Contrat d'API](02-contrat-api.md) | **Front + back : la référence commune** |
| [Guide back-end](03-backend.md) | Équipe back-end |
| [Guide front-end](04-frontend.md) | Équipe front-end |

Les diagrammes sont en Mermaid : ils s'affichent directement sur GitHub. Dans VS Code, installer l'extension *Markdown Preview Mermaid Support* ; pour une image (rapport, soutenance), coller le bloc dans [mermaid.live](https://mermaid.live) et exporter en PNG/SVG.

## Arborescence cible du dépôt

```
Assistant_IA_UEMF/
├── base_QR_EIDIA.xlsx
├── base_QR_EIDIA.jsonl
├── export_jsonl.py
├── docs/            ← vous êtes ici
├── backend/         ← FastAPI (voir 03-backend.md)
├── frontend/        ← React + Vite (voir 04-frontend.md)
└── docker-compose.yml
```

## Organisation de l'équipe

### Travailler en parallèle
1. **Jour 1** : valider ensemble le [contrat d'API](02-contrat-api.md). C'est le seul point de couplage.
2. Le front avance avec les **mocks MSW**, le back-end avec des tests pytest.
3. Dès que `POST /api/chat` existe côté back (tâche B7), le front passe `VITE_USE_MOCKS=false` (tâche F15).

### Jalons proposés

| Jalon | Front | Back |
|---|---|---|
| S1 — Fondations | F1–F6 : squelette, mocks, chat de base | B1–B5 : API, catalogue, index, recherche |
| S2 — Réponse complète | F7–F11 : sources, orientation, i18n/RTL, avis, erreurs | B6–B10 : LLM, chat, SQLite, avis, garde-fous |
| S3 — Intégration et qualité | F12, F14, F15 : accessibilité, tests, vrai back-end | B11, B13 : évaluation, Docker |
| S4 — Démo | Page À propos, finitions | Calibrage du seuil, rapport d'évaluation |

### Git
- Une branche par tâche : `front/F7-assistant-bubble`, `back/B5-retriever`, `docs/…`.
- Pull request vers `main` avec au moins **une relecture**.
- Toute modification du contrat d'API : relecture par un membre front **et** un membre back.
- Messages de commit courts, au présent : « Ajoute la carte d'orientation ».

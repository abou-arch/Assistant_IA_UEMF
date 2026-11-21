# Assistant IA UEMF — EIDIA

Assistant conversationnel (FR / EN / AR) qui répond aux questions sur l'École d'Ingénierie Digitale et d'Intelligence Artificielle (EIDIA) de l'Université Euromed de Fès, à partir d'une base de questions-réponses sourcées.

## Contenu

| Élément | Description |
|---|---|
| `base_QR_EIDIA.xlsx` | Base de questions-réponses (source de vérité, éditée à la main) |
| `base_QR_EIDIA.jsonl` | Export utilisé par le back-end |
| `export_jsonl.py` | `python export_jsonl.py base_QR_EIDIA.xlsx` régénère le JSONL |
| [`docs/`](docs/README.md) | Diagrammes UML, contrat d'API, guides back-end et front-end du prototype |

Commencer par [docs/README.md](docs/README.md).

# Étapes 5 et 6 : indexation et pipeline RAG

## Installation (à la racine du dépôt, à côté de `base_QR_EIDIA.jsonl`)
```bash
pip install -r rag/requirements.txt
cp rag/.env.example .env        # puis renseigner ANTHROPIC_API_KEY (ou LLM_PROVIDER=ollama)
```

## Ordre d'exécution
| Commande | Rôle | Étape |
|---|---|---|
| `python -m rag.check_corpus` | Contrôle structure + liste des fiches à traiter | 4 |
| `python -m rag.build_index` | Indexe les 68 fiches (relançable, écrit un manifest) | 5 |
| `python -m rag.eval_retrieval` | Recall@1/3/5 FR-EN-AR + scores hors périmètre | 5 |
| `python -m rag.cli` | Question → réponse + sources, avec questions de suivi | 6 |
| `python -m pytest rag/tests` | Tests du pipeline (sans LLM ni modèle à télécharger) | 6 |

## Choix de conception
- **Une fiche = un passage** (190 à 600 caractères) : pas de découpage, donc pas de chevauchement à gérer.
- On indexe `texte_a_indexer` (question FR + réponse). Les 9 fiches « Évaluation seulement » restent hors index.
- **Les sources ne sont jamais générées par le LLM** : il cite des identifiants `[Qxxx]`, le code vérifie qu'ils existent dans les passages récupérés, puis ajoute les URL officielles depuis le JSONL.
- Prompt défensif : fiches et question encadrées par des balises, échappées, traitées comme des données ; règle explicite anti-injection et anti-fuite du prompt.
- `MIN_SCORE=0.0` par défaut (désactivé) : à calibrer sur le vrai modèle d'embeddings.
- `EMBED_BACKEND=hash` : baseline lexicale pour tester sans téléchargement ; ne pas utiliser en démo.

## Limites connues
- Le recall mesuré ici est celui de la baseline lexicale (AR ≈ 3 %). Les chiffres du modèle E5 sont à produire sur votre machine.
- Pas de re-ranking ni de recherche hybride (leviers de l'étape 9).
- Les questions du jeu d'évaluation sont aussi les questions indexées : pour l'étape 8, ajouter des formulations nouvelles.

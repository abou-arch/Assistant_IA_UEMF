# Front-end minimal — Assistant EIDIA

Première version volontairement simple (React + Vite + TypeScript, CSS pur, aucune autre dépendance). Les évolutions prévues sont dans [docs/04-frontend.md](../docs/04-frontend.md).

## Lancer

1. API (à la racine du dépôt) — voir aussi [rag/README_RAG.md](../rag/README_RAG.md) :

```powershell
pip install -r api/requirements.txt
```

```powershell
uvicorn api.main:app --reload --port 8000
```

2. Front :

```powershell
cd frontend; npm install; npm run dev
```

Ouvrir http://localhost:5173 (Vite redirige `/api` vers le port 8000).

## Ce qui est fait

- Chat avec historique (conversation gardée côté API, en mémoire)
- Questions suggérées (une par catégorie)
- Sources officielles cliquables, carte d'orientation, avertissement « à confirmer », année de validité
- FR / EN / AR avec bascule RTL, langue mémorisée
- Erreur + bouton Réessayer, délai de 120 s (Ollama en local peut être lent)
- Thème clair / sombre selon le système

## Pas encore fait

Rendu Markdown, avis 👍/👎, mocks MSW, tests, persistance de la conversation au rechargement, page À propos, charte UEMF.

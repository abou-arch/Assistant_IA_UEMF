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

**Page vitrine EIDIA** (`src/components/Landing.tsx`), ambiance sombre inspirée du modèle Framer *Eventide*, aux couleurs relevées dans le CSS de ueuromed.org (bleu `#003882`, dégradé `#0a0a0a → #003882`, cyan `#0e9ed4`) ; Montserrat remplace Gotham, police payante du site UEMF.
- Hero animé (orbites), bandeau des partenaires, formations et 5 filières, parcours en 5 ans, vitrine de l'assistant, vie de campus, chiffres, FAQ, appel final
- Contenus repris de `base_QR_EIDIA.jsonl` ; navigation qui se masque au défilement, apparition des sections

**Assistant intégré discrètement** (`src/components/ChatWidget.tsx`) : bouton flottant en bas de page (à gauche en arabe) qui ouvre un panneau de chat, plein écran sur mobile.
- S'ouvre aussi depuis la page : « Poser une question », « Demander à l'assistant » sur chaque formation, clic sur une filière ou une question de la FAQ (la question est envoyée directement)
- Lien direct : `http://localhost:5173/#assistant` ouvre le chat ; Échap le ferme
- Sources, orientation, avertissement « à confirmer », validité, erreur + Réessayer (délai de 120 s pour Ollama)

FR / EN / AR avec bascule RTL, langue mémorisée ; `prefers-reduced-motion` respecté.

## Pas encore fait

Rendu Markdown, avis 👍/👎, mocks MSW, tests, persistance de la conversation au rechargement, logo officiel et photos du campus, menu mobile pour la navigation.

# Guide front-end

## 1. Rôle

Offrir une interface de discussion simple, rapide et accessible, en **français, anglais et arabe (de droite à gauche)**, qui met en avant les **sources officielles** et l'**orientation** vers les bons services. Le front doit pouvoir avancer **sans attendre le back-end** grâce à des mocks qui respectent le contrat d'API.

## 2. Pile technique

| Besoin | Choix |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Outil de build | Vite |
| Style | Tailwind CSS (+ propriétés logiques `ms-*`, `me-*`, `ps-*`, `pe-*` pour le RTL) |
| Requêtes API | TanStack Query (`useMutation` pour le chat, `useQuery` pour les suggestions) |
| État du chat | Zustand (petit store, persistance de `conversationId` et de la langue) |
| Routage | React Router |
| Internationalisation | i18next + react-i18next |
| Rendu de la réponse | react-markdown (sans `rehype-raw` : pas de HTML brut) |
| Icônes | lucide-react |
| Mocks d'API | MSW (Mock Service Worker) |
| Tests | Vitest + Testing Library ; Playwright pour 2–3 parcours de bout en bout |
| Qualité | ESLint + Prettier |

## 3. Initialisation

```powershell
npm create vite@latest frontend -- --template react-ts
```

```powershell
cd frontend
npm install @tanstack/react-query zustand react-router-dom i18next react-i18next i18next-browser-languagedetector react-markdown lucide-react clsx
npm install -D tailwindcss @tailwindcss/vite msw vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test
npx msw init public/ --save
```

`vite.config.ts` — proxy vers le back-end en développement :

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": "http://localhost:8000" } },
});
```

`.env.development` :

```dotenv
VITE_USE_MOCKS=true      # passer à false dès que le back-end répond
VITE_API_BASE=/api
```

## 4. Arborescence

```
frontend/
├── public/
│   ├── logo-eidia.svg
│   └── mockServiceWorker.js
├── src/
│   ├── main.tsx                    # démarre MSW si VITE_USE_MOCKS, puis l'app
│   ├── App.tsx                     # Providers + routes
│   ├── api/
│   │   ├── types.ts                # copie fidèle des types du contrat d'API
│   │   ├── client.ts               # fetch + gestion du format Erreur
│   │   ├── chat.ts                 # envoyerMessage, obtenirConversation
│   │   ├── catalogue.ts            # obtenirSuggestions, obtenirCategories
│   │   └── avis.ts
│   ├── mocks/
│   │   ├── browser.ts
│   │   ├── handlers.ts             # un handler par endpoint du contrat
│   │   └── donnees.ts              # réponses tirées de base_QR_EIDIA.jsonl
│   ├── store/
│   │   └── useChatStore.ts
│   ├── hooks/
│   │   ├── useEnvoyerMessage.ts
│   │   ├── useSuggestions.ts
│   │   ├── useAutoScroll.ts
│   │   └── useDirection.ts         # met à jour <html lang dir>
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/{fr,en,ar}.json
│   ├── components/
│   │   ├── layout/   AppLayout, Header, Footer, LanguageSwitcher, ThemeToggle
│   │   ├── chat/     MessageList, UserBubble, AssistantBubble, Composer,
│   │   │             TypingIndicator, MarkdownContent, RetryButton
│   │   ├── reponse/  SourceList, SourceChip, OrientationCard,
│   │   │             ConfirmWarning, ValiditeBadge, FeedbackButtons
│   │   ├── accueil/  WelcomeScreen, SuggestionGrid, SuggestionChip
│   │   └── ui/       Button, Toast, Spinner, ErrorBanner
│   ├── pages/
│   │   ├── ChatPage.tsx
│   │   ├── AProposPage.tsx
│   │   └── AdminPage.tsx           # V2
│   ├── styles/index.css
│   └── test/setup.ts
├── e2e/
├── index.html
└── package.json
```

## 5. Écrans

### 5.1 Accueil (conversation vide)
- Titre : « Bonjour, je suis l'assistant de l'EIDIA » + une phrase de périmètre (formations, admission, frais, vie étudiante…).
- **Grille de suggestions** groupées par catégorie (6 à 8 puces, `GET /api/suggestions`). Un clic envoie la question.
- Avertissement discret : « Réponses générées par IA à partir des informations publiées par l'UEMF. Vérifiez les informations importantes auprès des services. Ne saisissez pas de données personnelles. »

### 5.2 Conversation
- Bulles utilisateur alignées à la fin de ligne (`justify-end`, donc à gauche en arabe), bulles assistant au début.
- Sous chaque réponse de l'assistant, dans cet ordre :
  1. `ConfirmWarning` si `a_confirmer` (« Information à confirmer auprès du service concerné »).
  2. `MarkdownContent` (liens ouverts dans un nouvel onglet avec `rel="noopener noreferrer"`).
  3. `ValiditeBadge` : « Valable pour 2026-2027 ».
  4. `SourceList` : puces cliquables avec le titre de la source.
  5. `OrientationCard` si `orientation` : libellé + contact cliquable (`tel:` ou `mailto:`).
  6. `FeedbackButtons` 👍 / 👎 (+ champ commentaire après 👎).
- Réponses de refus (`refus_perimetre`, `refus_orienter`) : style neutre, puis 3 suggestions.
- `TypingIndicator` pendant l'attente ; au-delà de 8 s, texte « La réponse prend un peu plus de temps… ».
- Erreur : bulle rouge pâle + `RetryButton`.

### 5.3 Composer (zone de saisie)
- `textarea` qui s'agrandit (max 5 lignes), **Entrée** = envoyer, **Maj + Entrée** = retour à la ligne.
- Compteur visible à partir de 800 caractères, blocage à 1 000.
- Bouton désactivé si vide ou si une réponse est en attente.
- Focus automatique après l'envoi et après la réception.

### 5.4 En-tête
Logo EIDIA · sélecteur de langue (FR / EN / العربية) · bouton « Nouvelle conversation » · bascule clair / sombre.

### 5.5 À propos
Périmètre de l'assistant, liste des catégories (`GET /api/categories`), sources officielles, équipe projet.

### 5.6 Admin (V2)
Saisie de la clé admin, statistiques, liste des avis 👎 avec question / réponse, bouton « Réindexer ».

## 6. État et flux de données

```ts
// store/useChatStore.ts (extrait)
interface UiMessage {
  id: string;                         // id local (crypto.randomUUID) puis message_id serveur
  role: "user" | "assistant";
  contenu: string;
  etat: "envoi" | "recu" | "erreur";
  meta?: ChatResponse;                // pour les réponses de l'assistant
  avis?: "utile" | "pas_utile";
}

interface ChatState {
  conversationId: string | null;      // persisté (localStorage)
  langue: Langue;                     // persistée
  messages: UiMessage[];
  envoyer: (texte: string) => Promise<void>;
  reessayer: (idLocal: string) => Promise<void>;
  noter: (messageId: string, note: Note, commentaire?: string) => Promise<void>;
  nouvelleConversation: () => void;
}
```

Règles :
- Un seul message en vol à la fois.
- La bulle utilisateur est ajoutée **immédiatement** (affichage optimiste).
- Au rechargement de la page, si `conversationId` existe, recharger l'historique ; sur `404`, repartir à zéro sans afficher d'erreur.
- Délai côté client : 30 s (`AbortController`).

## 7. Internationalisation et RTL

- Clés de traduction en anglais technique, valeurs dans les 3 fichiers : `chat.placeholder`, `chat.send`, `chat.retry`, `reponse.sources`, `reponse.orientation`, `reponse.aConfirmer`, `reponse.validite`, `avis.merci`, `erreurs.reseau`, `erreurs.tropDeRequetes`, `accueil.titre`, `accueil.avertissement`, …
- Au changement de langue : `document.documentElement.lang = langue` et `dir = langue === "ar" ? "rtl" : "ltr"` (hook `useDirection`).
- Utiliser **uniquement** les utilitaires logiques Tailwind (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`) ; jamais `ml-`/`mr-`/`left-`/`right-`.
- Icônes directionnelles (flèche « envoyer ») : `rtl:-scale-x-100`.
- Police arabe : ajouter une police lisible (ex. *Noto Sans Arabic* via Google Fonts) dans la pile `font-sans`.
- La langue de l'interface est envoyée dans `langue` ; la réponse peut être dans la langue détectée de la question : afficher chaque bulle avec son propre `dir="auto"`.

## 8. Accessibilité (objectif WCAG 2.1 AA)

- `MessageList` : `role="log"` + `aria-live="polite"` pour que les lecteurs d'écran annoncent les nouvelles réponses.
- Toutes les commandes au clavier, focus visible (`focus-visible:ring`).
- Contraste ≥ 4,5:1 en clair et en sombre.
- `aria-label` traduits sur les boutons icônes (envoyer, 👍, 👎, langue).
- Respect de `prefers-reduced-motion` pour l'indicateur de saisie et le défilement.
- Cibles tactiles ≥ 44 × 44 px ; mise en page utilisable dès 360 px de large.

## 9. Charte visuelle (à aligner sur la charte UEMF)

Définir les couleurs comme variables CSS dans `styles/index.css` et les exposer à Tailwind :

```css
:root {
  --couleur-primaire: #0b3d6e;   /* à remplacer par la couleur officielle UEMF */
  --couleur-accent:   #c8a24a;
  --fond:             #ffffff;
  --surface:          #f4f6f9;
  --texte:            #1a1f2b;
  --texte-doux:       #5b6575;
  --bordure:          #dde2ea;
  --alerte:           #b45309;
  --erreur:           #b42318;
}
.dark {
  --fond:    #0f141c;
  --surface: #18202b;
  --texte:   #e8ecf2;
  --texte-doux: #9aa5b5;
  --bordure: #2a3442;
}
```

Les valeurs ci-dessus sont **provisoires** : récupérer les couleurs et le logo officiels auprès du service communication.

## 10. Mocks (travailler sans le back-end)

`mocks/handlers.ts` implémente chaque endpoint du contrat. Pour `POST /api/chat`, choisir une réponse selon des mots-clés afin de couvrir **tous les cas d'affichage** :

| Mot-clé dans la question | Réponse simulée |
|---|---|
| « frais », « prix », « fees » | `repondre_citer` avec 1 source, validité 2026-2027 |
| « bourse » | `repondre_limite_orienter` avec orientation + `a_confirmer: true` |
| « stage » | `non_publie_orienter` sans source |
| « ignore », « prompt » | `refus_perimetre` |
| « erreur » | `503 llm_indisponible` |
| « lent » | délai de 10 s |
| autre | `repondre_citer` générique |

Ajouter un délai aléatoire de 600 à 1 500 ms pour voir l'indicateur de saisie. Reprendre des textes réels de `base_QR_EIDIA.jsonl` pour que les maquettes soient crédibles.

## 11. Tests

- **Unitaires / composants (Vitest)** : `AssistantBubble` affiche sources, orientation, avertissement selon les props ; `Composer` bloque à 1 000 caractères et gère Entrée / Maj + Entrée ; `LanguageSwitcher` met `dir="rtl"`.
- **Store** : envoi → succès, envoi → erreur → réessai.
- **Bout en bout (Playwright, avec MSW)** :
  1. Clic sur une suggestion → réponse avec source.
  2. Passage en arabe → mise en page RTL, envoi d'une question.
  3. Erreur 503 → bouton Réessayer → succès.

## 12. Découpage des tâches

| # | Tâche | Priorité | Dépend de |
|---|---|---|---|
| F1 | Initialiser Vite + TS + Tailwind + ESLint/Prettier | P0 | — |
| F2 | `api/types.ts` + `api/client.ts` conformes au contrat | P0 | F1 |
| F3 | MSW : handlers et données de démo | P0 | F2 |
| F4 | `AppLayout`, `Header`, `Footer`, thème clair/sombre | P0 | F1 |
| F5 | `useChatStore` + `useEnvoyerMessage` | P0 | F2 |
| F6 | `MessageList`, bulles, `TypingIndicator`, `Composer` | P0 | F5 |
| F7 | `AssistantBubble` complet : Markdown, sources, orientation, avertissement, validité | P0 | F6 |
| F8 | Accueil + suggestions | P1 | F3 |
| F9 | i18n FR / EN / AR + RTL | P1 | F4 |
| F10 | Avis 👍 / 👎 | P1 | F7 |
| F11 | Erreurs, réessai, délai, persistance de la conversation | P1 | F5 |
| F12 | Accessibilité + responsive (audit Lighthouse ≥ 90) | P1 | F7 |
| F13 | Page À propos | P2 | F9 |
| F14 | Tests Vitest + Playwright | P1 | F7 |
| F15 | Branchement sur le vrai back-end (`VITE_USE_MOCKS=false`) | P0 | B7 côté back |
| F16 | Page Admin | P2 | B12 côté back |

## 13. Définition de « terminé »

- Composant fonctionnel en FR, EN **et** AR (vérifié en RTL).
- Utilisable au clavier, sans erreur dans la console.
- Testé (au moins un test de composant pour les éléments de réponse).
- Fonctionne avec les mocks **et** avec le back-end réel quand l'endpoint existe.
- `npm run lint` et `npm run build` passent.

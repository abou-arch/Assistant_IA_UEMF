# Diagrammes de composants et de déploiement

## 1. Composants — vue d'ensemble

```mermaid
flowchart LR
    subgraph FE["Front-end — React + Vite + TS"]
        direction TB
        Pages[Pages<br/>ChatPage · AProposPage · AdminPage]
        Comp[Composants UI<br/>MessageList · Composer · SourceList…]
        Store[État<br/>useChatStore · TanStack Query]
        I18N[i18n<br/>fr · en · ar + RTL]
        Client[Client API<br/>api/client.ts]
        MSW[(Mocks MSW<br/>dev uniquement)]
        Pages --> Comp --> Store --> Client
        Pages --> I18N
        Client -. "VITE_USE_MOCKS=true" .-> MSW
    end

    subgraph BE["Back-end — FastAPI (Python)"]
        direction TB
        Routes[Routes<br/>/chat · /suggestions · /avis · /admin]
        ChatSvc[ChatService]
        Guard[GardeFous]
        Retr[Retriever]
        Index[Indexeur]
        LLMc[ClientLLM]
        Repo[ConversationRepository]
        Routes --> ChatSvc
        ChatSvc --> Guard
        ChatSvc --> Retr
        ChatSvc --> LLMc
        ChatSvc --> Repo
        Routes --> Index
    end

    subgraph DATA["Données"]
        XLSX[[base_QR_EIDIA.xlsx]]
        JSONL[[base_QR_EIDIA.jsonl]]
        VDB[(ChromaDB<br/>index vectoriel)]
        SQL[(SQLite<br/>conversations · avis)]
    end

    EXT{{Fournisseur LLM<br/>API externe ou local}}

    Client -- "HTTP JSON /api/*" --> Routes
    XLSX -- export_jsonl.py --> JSONL
    Index --> JSONL
    Index --> VDB
    Retr --> VDB
    Repo --> SQL
    LLMc -- HTTPS --> EXT
```

## 2. Composants — arbre React

```mermaid
flowchart TD
    App --> Providers["Providers<br/>(QueryClient, i18n, Router, Theme)"]
    Providers --> Layout[AppLayout]
    Layout --> Header
    Header --> Logo
    Header --> LanguageSwitcher
    Header --> NewChatButton
    Header --> ThemeToggle
    Layout --> Outlet{{Route}}
    Layout --> Footer["Footer (avertissement IA)"]

    Outlet --> ChatPage
    Outlet --> AProposPage
    Outlet --> AdminPage["AdminPage (V2)"]

    ChatPage --> WelcomeScreen
    WelcomeScreen --> SuggestionGrid
    SuggestionGrid --> SuggestionChip
    ChatPage --> MessageList
    MessageList --> UserBubble
    MessageList --> AssistantBubble
    MessageList --> TypingIndicator
    AssistantBubble --> MarkdownContent
    AssistantBubble --> ConfirmWarning["ConfirmWarning<br/>(fiche à confirmer)"]
    AssistantBubble --> SourceList
    SourceList --> SourceChip
    AssistantBubble --> OrientationCard
    AssistantBubble --> FeedbackButtons
    AssistantBubble --> RetryButton
    ChatPage --> Composer
    Composer --> CharCounter
    ChatPage --> ErrorBanner["ErrorBanner<br/>(API hors ligne)"]
```

## 3. Déploiement — prototype

```mermaid
flowchart LR
    subgraph Poste["Navigateur du visiteur"]
        SPA[Application React<br/>fichiers statiques]
    end

    subgraph Serveur["Serveur / VM (Docker Compose)"]
        direction TB
        NGINX[Nginx<br/>:80 / :443<br/>sert le front + proxy /api]
        API[Conteneur api<br/>uvicorn :8000]
        VOL1[(volume chroma_data)]
        VOL2[(volume sqlite_data)]
        NGINX -- "/api/*" --> API
        API --> VOL1
        API --> VOL2
    end

    LLM{{Fournisseur LLM}}

    SPA -- HTTPS --> NGINX
    API -- "HTTPS (clé dans .env)" --> LLM
```

En développement, pas de Nginx : `npm run dev` (port 5173) et `uvicorn --reload` (port 8000), le proxy Vite redirige `/api` vers le back-end — pas de souci de CORS.

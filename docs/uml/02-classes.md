# Diagrammes de classes et modèle de données

## 1. Modèle du domaine (back-end)

Les attributs de `FicheQR` reprennent **exactement** les clés de `base_QR_EIDIA.jsonl` produites par `export_jsonl.py`.

```mermaid
classDiagram
    direction LR

    class FicheQR {
        +str id
        +str categorie
        +str question
        +str variante
        +str question_en
        +str question_ar
        +str reponse
        +ComportementAttendu comportement_attendu
        +str orientation
        +list~Source~ sources
        +str validite
        +str origine
        +TypeQuestion type_question
        +Statut statut
        +Usage usage
        +str note_verification
        +str relu_par
        +bool a_indexer
        +str texte_a_indexer
        +est_a_confirmer() bool
    }

    class Source {
        +str id
        +str titre
        +str url
    }

    class Categorie {
        +str nom
        +int nb_fiches
    }

    class ComportementAttendu {
        <<enumeration>>
        REPONDRE_CITER
        REPONDRE_LIMITE_ORIENTER
        NON_PUBLIE_ORIENTER
        REFUS_PERIMETRE
        REFUS_ORIENTER
        PRESENTATION
    }

    class TypeQuestion {
        <<enumeration>>
        FACTUELLE
        REPONSE_PARTIELLE
        PIEGE_SECURITE
        INFO_NON_PUBLIEE
        HORS_PERIMETRE
        META
    }

    class Statut {
        <<enumeration>>
        SOURCE
        SOURCE_A_CONFIRMER
        NON_PUBLIE
        TEST_SECURITE
        HORS_PERIMETRE
        REPONSE_TYPE
    }

    class Usage {
        <<enumeration>>
        BASE_ET_EVALUATION
        EVALUATION_SEULEMENT
    }

    class Conversation {
        +str id
        +Langue langue
        +datetime cree_le
        +datetime maj_le
        +list~Message~ messages
    }

    class Message {
        +str id
        +str conversation_id
        +Role role
        +str contenu
        +Langue langue
        +datetime cree_le
    }

    class ReponseAssistant {
        +ComportementAttendu comportement
        +list~Source~ sources
        +Orientation orientation
        +list~str~ fiches_utilisees
        +float confiance
        +str validite
        +bool a_confirmer
    }

    class Orientation {
        +str libelle
        +str contact
    }

    class Avis {
        +str id
        +str message_id
        +Note note
        +str commentaire
        +datetime cree_le
    }

    class ResultatRecherche {
        +FicheQR fiche
        +float score
    }

    class Role {
        <<enumeration>>
        UTILISATEUR
        ASSISTANT
    }

    class Langue {
        <<enumeration>>
        FR
        EN
        AR
    }

    class Note {
        <<enumeration>>
        UTILE
        PAS_UTILE
    }

    FicheQR "*" --> "1..*" Source : cite
    FicheQR "*" --> "1" Categorie : appartient à
    FicheQR --> ComportementAttendu
    FicheQR --> TypeQuestion
    FicheQR --> Statut
    FicheQR --> Usage
    Conversation "1" *-- "*" Message : contient
    Message <|-- ReponseAssistant
    ReponseAssistant "1" --> "0..1" Orientation
    ReponseAssistant "1" --> "*" Source
    Message "1" --> "0..1" Avis : reçoit
    ResultatRecherche "*" --> "1" FicheQR
```

### Correspondance valeurs Excel ↔ énumérations

| Valeur dans la base | Énumération API |
|---|---|
| Répondre et citer la source | `repondre_citer` |
| Répondre, signaler la limite et orienter | `repondre_limite_orienter` |
| Dire que l'info n'est pas publiée et orienter | `non_publie_orienter` |
| Refuser et rester dans le périmètre | `refus_perimetre` |
| Refuser poliment et orienter | `refus_orienter` |
| Présenter le périmètre | `presentation` |

## 2. Services du back-end

```mermaid
classDiagram
    direction TB

    class ChatService {
        -Retriever retriever
        -GardeFous garde_fous
        -ClientLLM llm
        -ConversationRepository repo
        +repondre(question, langue, conversation_id) ReponseAssistant
    }

    class GardeFous {
        +detecter_langue(texte) Langue
        +est_injection(texte) bool
        +est_hors_perimetre(resultats) bool
        +verifier_citations(reponse, fiches) bool
    }

    class Retriever {
        -IndexVectoriel index
        -float seuil_score
        +rechercher(question, k) list~ResultatRecherche~
    }

    class Indexeur {
        -ChargeurBase chargeur
        -Embedder embedder
        -IndexVectoriel index
        +indexer_tout() int
    }

    class ChargeurBase {
        +charger(chemin_jsonl) list~FicheQR~
        +categories() list~Categorie~
    }

    class Embedder {
        <<interface>>
        +encoder(textes) list~vecteur~
    }

    class IndexVectoriel {
        <<interface>>
        +ajouter(ids, vecteurs, metadonnees)
        +requete(vecteur, k) list~ResultatRecherche~
        +vider()
    }

    class ClientLLM {
        <<interface>>
        +generer(prompt_systeme, messages) str
    }

    class ConstructeurPrompt {
        +construire(question, fiches, langue, historique) prompt
    }

    class ConversationRepository {
        +creer(langue) Conversation
        +ajouter_message(message)
        +obtenir(id) Conversation
        +enregistrer_avis(avis)
        +statistiques() dict
    }

    class Evaluateur {
        +executer(fiches_test) RapportEvaluation
    }

    ChatService --> GardeFous
    ChatService --> Retriever
    ChatService --> ConstructeurPrompt
    ChatService --> ClientLLM
    ChatService --> ConversationRepository
    Retriever --> IndexVectoriel
    Retriever --> Embedder
    Indexeur --> ChargeurBase
    Indexeur --> Embedder
    Indexeur --> IndexVectoriel
    Evaluateur --> ChatService
```

Les trois `<<interface>>` permettent de changer de fournisseur (modèle d'embeddings, base vectorielle, LLM) sans toucher au reste du code.

## 3. Modèle relationnel (SQLite) — conversations et avis

La base Q/R reste dans le JSONL + l'index vectoriel. SQLite ne stocke que ce que le prototype produit.

```mermaid
erDiagram
    CONVERSATION ||--o{ MESSAGE : contient
    MESSAGE ||--o| AVIS : recoit

    CONVERSATION {
        TEXT id PK
        TEXT langue
        DATETIME cree_le
        DATETIME maj_le
    }

    MESSAGE {
        TEXT id PK
        TEXT conversation_id FK
        TEXT role "utilisateur | assistant"
        TEXT contenu
        TEXT langue
        TEXT comportement "null pour l'utilisateur"
        TEXT sources_json
        TEXT orientation_json
        TEXT fiches_utilisees_json
        REAL confiance
        INTEGER latence_ms
        DATETIME cree_le
    }

    AVIS {
        TEXT id PK
        TEXT message_id FK "UNIQUE"
        TEXT note "utile | pas_utile"
        TEXT commentaire
        DATETIME cree_le
    }
```

## 4. Types côté front-end (TypeScript)

```mermaid
classDiagram
    direction LR

    class ChatRequest {
        +string? conversation_id
        +string message
        +Langue langue
    }

    class ChatResponse {
        +string conversation_id
        +string message_id
        +Langue langue
        +string contenu
        +Comportement comportement
        +Source[] sources
        +Orientation? orientation
        +string[] fiches_utilisees
        +number confiance
        +string? validite
        +boolean a_confirmer
        +string cree_le
    }

    class UiMessage {
        +string id
        +Role role
        +string contenu
        +EtatMessage etat
        +ChatResponse? meta
        +Note? avis
    }

    class EtatMessage {
        <<enumeration>>
        envoi
        recu
        erreur
    }

    class ChatStore {
        +string? conversationId
        +UiMessage[] messages
        +Langue langue
        +envoyer(texte)
        +reessayer(id)
        +nouvelleConversation()
        +noter(id, note, commentaire)
    }

    ChatStore "1" *-- "*" UiMessage
    UiMessage --> EtatMessage
    UiMessage --> ChatResponse : meta
    ChatStore ..> ChatRequest : envoie
    ChatStore ..> ChatResponse : reçoit
```

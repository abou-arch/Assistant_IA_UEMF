# Diagrammes d'activité et d'états

## 1. Activité — traitement d'une question (back-end)

```mermaid
flowchart TD
    A([Question reçue]) --> B{Corps valide ?<br/>1 à 1 000 caractères}
    B -- Non --> B1[422 erreur de validation] --> Z([Fin])
    B -- Oui --> C[Détecter la langue FR / EN / AR]
    C --> D{Tentative d'injection<br/>ou contenu abusif ?}
    D -- Oui --> D1[Réponse type « refus_perimetre »<br/>dans la langue détectée]
    D -- Non --> E[Rechercher les k = 4 fiches les plus proches]
    E --> F{Meilleur score ≥ seuil ?}
    F -- Non --> F1[Réponse « non_publie_orienter »<br/>+ orientation par défaut]
    F -- Oui --> G{Fiche principale :<br/>type Hors périmètre ?}
    G -- Oui --> G1[Utiliser la réponse type de la fiche<br/>sans appeler le LLM]
    G -- Non --> H[Construire le prompt :<br/>consignes + fiches + 4 derniers échanges]
    H --> I[Appeler le LLM]
    I --> J{Réponse reçue<br/>avant le délai ?}
    J -- Non --> J1[503 LLM indisponible] --> Z
    J -- Oui --> K{Citations conformes<br/>aux fiches fournies ?}
    K -- Non --> K1[Repli : réponse de la fiche principale<br/>traduite si besoin]
    K -- Oui --> L[Assembler sources, orientation,<br/>validité, a_confirmer]
    K1 --> L
    D1 --> M
    F1 --> M
    G1 --> M
    L --> M[Enregistrer le message en SQLite]
    M --> N([200 ChatResponse])
```

## 2. Activité — parcours utilisateur (front-end)

```mermaid
flowchart TD
    S([Arrivée sur le site]) --> L{Langue mémorisée ?}
    L -- Oui --> L1[Appliquer la langue]
    L -- Non --> L2[Langue du navigateur, sinon FR]
    L1 --> W
    L2 --> W[Écran d'accueil :<br/>présentation + suggestions par catégorie]
    W --> Q{Action}
    Q -- Clic suggestion --> E[Remplir et envoyer]
    Q -- Saisie libre --> E
    Q -- Changer de langue --> W
    E --> T[Afficher la bulle + indicateur]
    T --> R{Réponse API}
    R -- Succès --> A[Afficher réponse, sources,<br/>orientation, avertissement éventuel]
    R -- Erreur --> X[Bulle en erreur + bouton Réessayer]
    X -- Réessayer --> T
    A --> F{Avis ?}
    F -- 👍 / 👎 --> F1[Envoyer l'avis]
    F -- Non --> Q2
    F1 --> Q2{Continuer ?}
    Q2 -- Nouvelle question --> E
    Q2 -- Nouvelle conversation --> W
    Q2 -- Quitter --> Fin([Fin])
```

## 3. États — un message côté front

```mermaid
stateDiagram-v2
    [*] --> Brouillon : saisie
    Brouillon --> Envoi : Entrée / bouton Envoyer
    Brouillon --> [*] : vidé

    Envoi --> Recu : 200
    Envoi --> Erreur : réseau / 5xx / délai > 30 s
    Erreur --> Envoi : Réessayer

    state Recu {
        [*] --> SansAvis
        SansAvis --> Utile : 👍
        SansAvis --> PasUtile : 👎
        Utile --> PasUtile : change d'avis
        PasUtile --> Utile : change d'avis
    }

    Recu --> [*]
```

## 4. États — la conversation

```mermaid
stateDiagram-v2
    [*] --> Vide : ouverture / nouvelle conversation
    Vide --> EnAttente : 1er message envoyé
    EnAttente --> Active : réponse reçue (conversation_id créé)
    Active --> EnAttente : message suivant
    EnAttente --> Active : erreur (le message reste en erreur)
    Active --> Vide : « Nouvelle conversation »
    Active --> Expiree : conversation_id inconnu (404)
    Expiree --> Vide
```

Pendant `EnAttente`, le champ de saisie reste éditable mais le bouton **Envoyer** est désactivé : un seul message en vol à la fois.

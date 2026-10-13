# Personalized Guesthouse Discovery — ERD

```mermaid
erDiagram
    User ||--o{ FavouriteCollection : owns
    User ||--o{ Comparison : owns
    User ||--o{ SearchHistory : creates

    FavouriteCollection }o--o{ Guesthouse : contains
    Comparison }o--o{ Guesthouse : compares

    User {
        ObjectId _id PK
    }

    Guesthouse {
        ObjectId _id PK
    }

    FavouriteCollection {
        ObjectId _id PK
        ObjectId customerId FK
        string name
        ObjectId[] guesthouseIds
        Date createdAt
        Date updatedAt
    }

    Comparison {
        ObjectId _id PK
        ObjectId customerId FK
        string name
        ObjectId[] guesthouseIds
        Date createdAt
        Date updatedAt
    }

    SearchHistory {
        ObjectId _id PK
        ObjectId customerId FK
        string searchTerm
        string location
        object filters
        Date createdAt
    }
```

## Relationship notes

- One customer can own many favourite collections, comparisons, and search-history records.
- Each collection or comparison belongs to one customer.
- Collections and comparisons store guesthouse references in `guesthouseIds`.
- Search history belongs to a customer and stores the search term, location, filters, and creation time.
- `customerId` and `guesthouseIds` are MongoDB references. They are not SQL foreign-key constraints; ownership and guesthouse existence are validated by the application.
- Collections and comparisons may have an empty `guesthouseIds` array.

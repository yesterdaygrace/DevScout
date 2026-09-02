# Entity Relationship

> Source: `src/supabase/migrations.sql`. Detailed columns: `docs/database.md`.

```
auth.users (Supabase Auth)
    │
    │  AFTER INSERT ──► handle_new_user() ──INSERT──► profiles
    │                                        (id PK → auth.users.id)
    │                                         ├── email
    │                                         ├── display_name
    │                                         └── created_at
    │
    ├─ 1──∞ shortlist
    │        (id PK, user_id FK → profiles, github_username)
    │
    ├─ 1──∞ notes
    │        (id PK, user_id FK, github_username, content, tags[], created_at, updated_at)
    │
    ├─ 1──∞ recently_viewed
    │        (id PK, user_id FK, github_username, viewed_at)
    │
    ├─ 1──∞ saved_searches
    │        (id PK, user_id FK, query, filters JSONB, created_at)
    │
    └─ 1──∞ collections
             (id PK, user_id FK, name, created_at)
                  │
                  └─ 1──∞ collection_members
                           (id PK, collection_id FK → collections, github_username, created_at)
                           RLS: EXISTS (SELECT 1 FROM collections
                                        WHERE id = collection_id AND user_id = auth.uid())
```

**Notes:**
- All relations are per-user; no cross-user FKs. Isolation is RLS, not application JOINs.
- `shortlist`, `notes`, `recently_viewed`, `collection_members` all store `github_username` (denormalized) rather than a `github_users` table — GitHub is source of truth, no sync table needed.
- To query a user's shortlist with notes: `SELECT * FROM shortlist WHERE user_id=auth.uid()` then enrich client-side via `src/services/githubService.ts:getUser`.

# Database

> Source: `src/supabase/migrations.sql` (re-runnable, `IF NOT EXISTS` + `DROP POLICY IF EXISTS`). ER: `docs/er.md`.

## Tables (7)

| Table | PK | FK | Notable columns | Behavior |
|---|---|---|---|---|
| `profiles` | `id UUID → auth.users(id) CASCADE` | — | `email TEXT`, `display_name TEXT`, `created_at` | Auto-created by `handle_new_user()` trigger on `auth.users` INSERT |
| `shortlist` | `id UUID` | `user_id → profiles(id) CASCADE` | `github_username TEXT NOT NULL`, `created_at` | One row per favorited dev per user |
| `notes` | `id UUID` | `user_id → profiles` | `github_username TEXT`, `content TEXT NOT NULL`, `tags TEXT[] DEFAULT '{}'`, `created_at`, `updated_at` | Markdown, tag-filtered search |
| `recently_viewed` | `id UUID` | `user_id → profiles` | `github_username TEXT`, `viewed_at` | Append-only history |
| `saved_searches` | `id UUID` | `user_id → profiles` | `query TEXT NOT NULL`, `filters JSONB DEFAULT '{}'`, `created_at` | Reusable search params |
| `collections` | `id UUID` | `user_id → profiles` | `name TEXT NOT NULL`, `created_at` | User-owned pipelines |
| `collection_members` | `id UUID` | `collection_id → collections(id) CASCADE` | `github_username TEXT`, `created_at` | Membership; RLS via parent |

All PKs `gen_random_uuid()`. All `CASCADE` ensures orphan cleanup.

## Row Level Security

`ENABLE ROW LEVEL SECURITY` on all 7 tables. 21 policies total (`DROP POLICY IF EXISTS` then `CREATE POLICY` — re-runnable):

- `profiles` (2): `SELECT`/`UPDATE` where `auth.uid()=id`.
- `shortlist` (3): `SELECT`/`INSERT` (WITH CHECK)/`DELETE` where `auth.uid()=user_id`.
- `notes` (4): `SELECT`/`INSERT`/`UPDATE`/`DELETE` where `auth.uid()=user_id`.
- `recently_viewed` (2): `SELECT`/`INSERT` where `auth.uid()=user_id` (no UPDATE/DELETE — append-only).
- `saved_searches` (3): `SELECT`/`INSERT`/`DELETE` where `auth.uid()=user_id`.
- `collections` (4): `SELECT`/`INSERT`/`UPDATE`/`DELETE` where `auth.uid()=user_id`.
- `collection_members` (3): `SELECT`/`INSERT`/`DELETE` where `EXISTS (SELECT 1 FROM collections WHERE id=collection_id AND user_id=auth.uid())`.

Client must call with authenticated Supabase session; demo mode (`src/services/mock.ts` + `src/stores/auth.ts`) bypasses entirely.

## Trigger

```sql
handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
  INSERT INTO profiles (id, email, display_name) VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Indexes & Constraints

- PK btree (default). FK indexed by Supabase. No additional indexes required for current query patterns (`eq user_id` + `order created_at`). `filters JSONB` is schemaless; query via `->>` if needed.
- No unique constraint on `(user_id, github_username)` — enforced at app layer (`isShortlisted` check); add `UNIQUE` if duplicate prevention becomes critical.

## Migrations

Run in Supabase SQL Editor: paste `src/supabase/migrations.sql` → Run. Safe to re-run. Verify via Authentication → Policies and Table Editor. No `make migrate-up`; `docs/deployment.md` covers local dev flow.

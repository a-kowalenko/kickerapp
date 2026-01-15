# KickerApp - AI Coding Guidelines

## Project Overview

KickerApp is a table football (foosball) game tracking web application with React frontend and Supabase PostgreSQL backend. The app manages multiple "kickers" (foosball tables/leagues), tracks matches, calculates MMR rankings, and supports seasons, teams, achievements, and real-time features.

## Architecture

### Frontend Structure (`src/`)

-   **`features/`** - Domain-organized modules (matches, players, teams, achievements, admin, etc.)
    -   Each feature contains components (`*.jsx`), custom hooks (`use*.js`), and sometimes sub-components
    -   Hooks follow pattern: `useMatch.js` calls service functions and uses React Query
-   **`services/api*.js`** - Supabase API calls (e.g., `apiMatches.js`, `apiPlayer.js`)
-   **`contexts/`** - React contexts for global state (`KickerContext`, `MatchContext`, `DarkModeContext`)
-   **`hooks/`** - Reusable hooks not tied to specific features
-   **`ui/`** - Shared UI components with styled-components
-   **`utils/constants.js`** - All constants (table names, game modes, magic numbers)

### Key Data Flow Pattern

```
Component → useXxx hook → apiXxx service → Supabase client
                ↓
         React Query cache
```

Example: `MatchDetail.jsx` → `useMatch()` → `apiMatches.getMatch()` → `supabase.from('matches')`

### Database Schema (Dual Schema System)

-   **`public`** - Production schema
-   **`kopecht`** - Development/testing schema (nightly copy from `public`)
-   Schema selection via `VITE_DB_ENV` environment variable, defaults to `kopecht`

### Multi-Kicker Context

Every query is scoped by `currentKicker` from `KickerContext`. Always include kicker ID in:

-   React Query keys: `["matches", kickerId]`, `["players", kickerId]`
-   API calls: `getMatches({ kicker })`, `getPlayersByKicker(kickerId)`

## SQL Migrations (`migrations/`)

### Naming Convention

All migrations must have paired files for both schemas:

```
NNN_description_kopecht.sql      # Development schema
NNN_description_public.sql       # Production schema
NNN_description_kopecht_rollback.sql  # Optional rollback
NNN_description_public_rollback.sql   # Optional rollback
```

### Writing Migrations

1. Always set schema explicitly at the top:
    ```sql
    SET search_path TO kopecht;  -- or public
    ```
2. Use fully qualified table names: `kopecht.player`, `public.matches`
3. Include `IF NOT EXISTS` / `IF EXISTS` for idempotency
4. RLS policies check superadmin via: `(auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true`

## Code Patterns

### React Query Hooks

```javascript
// In features/xxx/useXxx.js
import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";

export function useMatch(id) {
    const { currentKicker: kicker } = useKicker();
    return useQuery({
        queryKey: ["match", id, kicker], // Always include kicker
        queryFn: () => getMatch({ matchId: id, kicker }),
    });
}
```

### Mutations with Cache Invalidation

```javascript
const { mutate } = useMutation({
    mutationFn: (data) => createMatchApi({ ...data, kicker }),
    onSuccess: (data) => {
        queryClient.invalidateQueries(["matches"]);
        queryClient.setQueryData(["match", data.id, kicker], data);
    },
});
```

### Constants Usage

Import table/column names from `utils/constants.js` instead of hardcoding:

```javascript
import { MATCHES, PLAYER, GAMEMODE_1ON1 } from "../utils/constants";
```

## Game Modes

-   `1on1` - Single player vs single player
-   `2on2` - Two players vs two players (ad-hoc teams)
-   `2on1` - Handicap mode
-   `team` - Permanent teams (from `teams` table)

## Development Commands

```bash
npm run dev          # Start dev server with HTTPS (mkcert)
npm run dev:network  # Expose to network
npm run build        # Production build
npm run lint         # ESLint
```

## Environment Variables

-   `VITE_DB_ENV` - Database schema (`public` or `kopecht`, default: `kopecht`)
-   `VITE_SUPABASE_KEY` - Supabase anon key

## Key Tables Reference

| Table                 | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `kicker`              | Foosball tables/leagues                   |
| `player`              | Players linked to users, scoped by kicker |
| `matches`             | Game records with scores, MMR changes     |
| `goals`               | Individual goals per match                |
| `seasons`             | Seasonal rankings periods                 |
| `season_rankings`     | Player stats per season                   |
| `teams`               | Permanent 2-player teams                  |
| `player_achievements` | Earned achievements                       |

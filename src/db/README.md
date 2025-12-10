# Database Schema Documentation

This directory contains the complete database schema definition for the zerohero project.
It serves as version-controlled documentation of the production (`public`) schema.

## Structure

```
src/db/
├── tables/           # Table definitions
├── functions/        # Database functions
├── triggers/         # Trigger definitions
├── policies/         # Row Level Security (RLS) policies
└── migrations/       # Migration scripts (symlink or copy from /migrations)
```

## Schema Overview

- **public** - Production schema
- **kopecht** - Development/Testing schema (nightly copy from public)

## Tables

| Table            | Description                       |
| ---------------- | --------------------------------- |
| `kicker`         | Kicker/Foosball table definitions |
| `player`         | Player profiles linked to users   |
| `matches`        | Match records with scores and MMR |
| `goals`          | Individual goal records           |
| `player_history` | Daily player statistics snapshots |

## Functions

| Function                     | Description                                                 |
| ---------------------------- | ----------------------------------------------------------- |
| `assign_match_number()`      | Trigger function to auto-increment match numbers per kicker |
| `get_player_matches_count()` | Get match count per player for a kicker                     |
| `get_players_by_kicker()`    | Get all players for a kicker                                |
| `update_player_history()`    | Daily job to snapshot player stats                          |
| `duplicate_schema_tables()`  | Copy public schema to kopecht (nightly)                     |

## Triggers

| Trigger               | Table   | Event         | Function                |
| --------------------- | ------- | ------------- | ----------------------- |
| `before_match_insert` | matches | BEFORE INSERT | `assign_match_number()` |

## RLS Policies

| Table     | Policies                                                       |
| --------- | -------------------------------------------------------------- |
| `goals`   | access_control, insert_control, update_control, delete_control |
| `matches` | access_control, insert_control, update_control                 |
| `player`  | Enable read access for all users (open)                        |

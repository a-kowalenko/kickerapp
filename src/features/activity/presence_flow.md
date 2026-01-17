# Presence System Architecture

Discord-style presence system with **rock-solid stability** and zero flickering.

---

## Design Principles

### 1. Receiver-Calculated State

We **only broadcast timestamps** (`online_at`, `last_activity_at`).

- Receiving clients calculate "idle" status locally
- No coordination problems between sender/receiver
- Consistent state across all clients

### 2. Unified Grace Period

Players are **never removed immediately** when they disappear:

- Whether from an explicit `leave` event
- Or simply missing from a `sync` snapshot (network hiccup, context switch)

**Every missing player enters a grace period (8 seconds).** If they reappear, removal is cancelled.

### 3. Optimistic Self-Presence

Current user is **always shown as online** when connected:

- Injected immediately on `SUBSCRIBED` (before any server sync)
- Prevents self-flickering during race conditions
- Falls back to cached data during brief disconnections

### 4. Instant Cleanup on Context Switch

When kicker changes, **all state is cleared immediately**:

- Prevents ghost users from previous context
- Fresh start for new kicker channel
- No carryover artifacts

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROADCASTING                            │
│                     (useOnlinePresence.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User Activity Events → updateActivity() → lastActivityRef     │
│                                    ↓                            │
│   HEARTBEAT (30s) ───────────→ trackPresence() ──────────────┐  │
│                                    ↓                         │  │
│                              channel.track({                 │  │
│                                player_id,                    │  │
│                                player_name,                  │  │
│                                player_avatar,                │  │
│                                online_at,        ← timestamp │  │
│                                last_activity_at, ← timestamp │  │
│                              })                              │  │
│                                    ↓                         │  │
│                          Supabase Presence                   │  │
│                                                              │  │
│   DB UPDATE (60s) ───────────→ upsertPlayerPresence()        │  │
│                                    ↓                         │  │
│                          Database (offline fallback)         │  │
│                                                              │  │
└──────────────────────────────────────────────────────────────┘  │
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
│
↓
┌─────────────────────────────────────────────────────────────────┐
│                          RECEIVING                              │
│                     (useOnlinePresence.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Supabase Presence                                             │
│        ↓                                                        │
│   on("sync") ──────────────────────────────────────────────────┐│
│        │                                                       ││
│        ├─ Build currentPresenceIds from state                  ││
│        │                                                       ││
│        ├─ Update playerCacheRef for present players            ││
│        │      { data: playerData, lastSeenAt: now }            ││
│        │                                                       ││
│        ├─ Check playerCacheRef for missing players:            ││
│        │      IF (now - lastSeenAt) < GRACE_PERIOD_MS          ││
│        │         → Keep player visible (still in grace period) ││
│        │      ELSE                                             ││
│        │         → Remove from cache (grace expired)           ││
│        │                                                       ││
│        └─ Optimistic self-presence injection                   ││
│                                                                ││
│   on("leave") ─────────────────────────────────────────────────┤│
│        │                                                       ││
│        └─ Update lastSeenAt to NOW (starts grace period)       ││
│                                                                ││
│   on("join") ──────────────────────────────────────────────────┤│
│        │                                                       ││
│        └─ Update cache with fresh data                         ││
│                                                                ││
└─────────────────────────────────────────────────────────────────┘│
                                                                   │
┌──────────────────────────────────────────────────────────────────┘
│
↓
┌─────────────────────────────────────────────────────────────────┐
│                    ACTIVITY CALCULATION                         │
│                   (usePlayersActivity.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   onlinePlayers (Map) + dbPlayers (DB query)                    │
│        ↓                                                        │
│   For each player in presence:                                  │
│        │                                                        │
│        ├─ Check if in active match → "playing"                  │
│        │                                                        │
│        ├─ Calculate idle locally:                               │
│        │      timeSinceActivity = now - last_activity_at        │
│        │      IF timeSinceActivity > IDLE_THRESHOLD (5 min)     │
│        │         → "idle"                                       │
│        │      ELSE                                              │
│        │         → "active"                                     │
│        │                                                        │
│        └─ Not in presence → "offline"                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Constants

| Constant                 | Value | Purpose                                     |
| ------------------------ | ----- | ------------------------------------------- |
| `HEARTBEAT_INTERVAL`     | 30s   | How often to broadcast presence             |
| `DB_UPDATE_INTERVAL`     | 60s   | How often to update `last_seen` in DB       |
| `GRACE_PERIOD_MS`        | 8s    | Time to keep missing players visible        |
| `LOGOUT_SIGNAL_DELAY`    | 500ms | Time to wait for logout signal to propagate |
| `IDLE_THRESHOLD`         | 5 min | Time after which a player is "idle"         |
| `ACTIVITY_THROTTLE`      | 1s    | Min time between activity updates           |
| `RECONNECT_DELAY`        | 2s    | Initial reconnection delay                  |
| `MAX_RECONNECT_ATTEMPTS` | 5     | Max reconnection attempts                   |

---

## Grace Period Deep Dive

### Why Unified?

Before: Grace period only applied to explicit `leave` events.

- **Problem**: When switching kickers (A → B → A), players in A might be missing from the first sync snapshot due to socket renegotiation. They'd flicker off then back on.

After: Grace period applies to **any disappearance**:

1. Explicit `leave` event → player enters grace period
2. Missing from `sync` snapshot → player enters grace period

### How It Works

```javascript
// playerCacheRef stores ALL known players with timestamps
playerCacheRef = Map<playerId, { data: PlayerData, lastSeenAt: number }>

// On sync:
1. Mark all present players with lastSeenAt = now
2. For missing players:
   - If (now - lastSeenAt) < GRACE_PERIOD_MS → keep visible
   - Else → remove from cache

// On leave:
- Update lastSeenAt = now (starts/resets grace period)

// On join:
- Update cache with fresh data
```

### Timeline Example

```
t=0    Player A appears in sync       → cache: { A: lastSeenAt=0 }
t=5s   Player A missing from sync     → (0-5) < 8000ms ✓ KEEP
t=7s   Player A missing from sync     → (0-7) < 8000ms ✓ KEEP
t=8s   Player A reappears in sync     → cache: { A: lastSeenAt=8 } ← RESET
t=15s  Player A triggers leave event  → cache: { A: lastSeenAt=15 }
t=20s  Player A missing from sync     → (15-20) < 8000ms ✓ KEEP
t=24s  Player A missing from sync     → (15-24) > 8000ms ✗ REMOVE
```

---

## Optimistic Self-Presence

Current user is injected into `onlinePlayers` **immediately** on `SUBSCRIBED`:

```javascript
// In subscribe callback, status === 'SUBSCRIBED'
1. Build self-presence data with current timestamps
2. Add to playerCacheRef
3. Add to onlinePlayers state
4. THEN set isConnected = true
5. THEN track() to server
```

This ensures the user sees themselves online **before** any server round-trip.

### Fallback Chain

If self is missing from a sync:

1. Check playerCacheRef for cached self-data
2. If not cached, build fresh from current refs
3. Always ensure self is in final merged map

---

## Context Switch Handling

When `kicker` changes:

1. `cleanupChannel()` clears timers, cache, channel
2. `setOnlinePlayers(new Map())` clears immediately
3. `setIsConnected(false)`
4. New channel subscription starts fresh

**No carryover from previous kicker.**

---

## Activity Events Tracked

```javascript
const ACTIVITY_EVENTS = [
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "click",
];
```

Plus: `visibilitychange`, `focus` (window)

All events update `lastActivityRef` (throttled to 1s min).

| `LOGOUT_SIGNAL_DELAY` | 500ms | Time to wait for logout signal to propagate |

---

## Instant Logout

### Problem

The grace period keeps disconnected players visible for 8 seconds. This is great for network hiccups, but bad for explicit logouts—users expect to disappear immediately.

### Solution: Logout Handshake

When a user explicitly logs out, we send a special signal **before** disconnecting:

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSTANT LOGOUT FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User clicks Logout                                            │
│        ↓                                                        │
│   handleLogout() triggered via 'userLogout' event               │
│        ↓                                                        │
│   channel.track({                                               │
│       ...normalPresenceData,                                    │
│       is_logged_out: true  ← LOGOUT SIGNAL                      │
│   })                                                            │
│        ↓                                                        │
│   Wait 500ms (LOGOUT_SIGNAL_DELAY)                              │
│        ↓                                                        │
│   cleanupChannel() - disconnect                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                              ↓ (propagates to other clients)

┌─────────────────────────────────────────────────────────────────┐
│                    RECEIVER HANDLING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   on("sync") receives presence with is_logged_out: true         │
│        ↓                                                        │
│   IF (presence.is_logged_out) {                                 │
│       playerCacheRef.delete(playerId)  ← BYPASS GRACE PERIOD    │
│       return; // Don't add to freshPlayers                      │
│   }                                                             │
│        ↓                                                        │
│   Player immediately removed from onlinePlayers Map             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Points

1. **Sender sends `is_logged_out: true`** before disconnecting
2. **Receiver detects the flag** in sync handler
3. **Receiver deletes from cache immediately** (no grace period)
4. **Player vanishes instantly** on all clients

### Code Flow

**Sender (logging out):**

```javascript
const handleLogout = async () => {
    // 1. Send logout signal
    await channel.track({ ...presence, is_logged_out: true });

    // 2. Wait for propagation
    await delay(500);

    // 3. Cleanup
    cleanupChannel();
};
```

**Receiver (in sync handler):**

```javascript
if (presence.is_logged_out) {
    playerCacheRef.current.delete(playerId);
    return; // Skip adding to freshPlayers
}
```

### Why 500ms Delay?

The delay ensures the logout packet has time to:

1. Leave the sender's network buffer
2. Reach Supabase servers
3. Be broadcast to other clients

Without the delay, the connection might close before the packet is sent.

---

## Database Fallback

DB stores `last_seen` timestamp for players who are **fully offline**.

Used by `usePlayersActivity` to show:

- "Last seen 5 minutes ago"
- "Last seen 2 hours ago"

Only updated every 60s (not critical path).

---

## Troubleshooting

### Players flickering?

- Check `GRACE_PERIOD_MS` (default 8s)
- Ensure `playerCacheRef` is not being cleared unexpectedly
- Check for multiple channel subscriptions (should be one per kicker)

### Self not appearing?

- Check `currentPlayerId` and `currentPlayerName` are defined
- Check optimistic injection in `SUBSCRIBED` handler
- Check `isConnected` state

### Stale idle status?

- `last_activity_at` comes from sender, calculated by receiver
- Check `IDLE_THRESHOLD` (default 5 min)
- Ensure activity events are being captured

### Ghost users after context switch?

- `cleanupChannel()` should clear `playerCacheRef`
- `setOnlinePlayers(new Map())` should run immediately on kicker change

### User stays online after logout?

- Ensure `userLogout` event is dispatched when user logs out
- Check that `handleLogout` sends `is_logged_out: true` signal
- Verify `LOGOUT_SIGNAL_DELAY` allows packet to propagate

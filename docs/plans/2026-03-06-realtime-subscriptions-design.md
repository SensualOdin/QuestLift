# Realtime Subscriptions Design

**Date**: 2026-03-06
**Status**: Approved

## Goal

Add Supabase Realtime subscriptions so party activity, raid damage, roster changes, and user profile updates appear live without page refresh.

## Architecture

Custom hooks pattern in `lib/supabase/realtime-hooks.ts`. Each hook:
1. Subscribes to a Supabase Realtime channel on mount
2. Listens for `postgres_changes` on specific tables with filters
3. Calls a callback to re-fetch data (no optimistic updates)
4. Unsubscribes on unmount via cleanup

## Hooks

### useRealtimePartyRoster
- **Table**: `party_members`
- **Filter**: `party_id=eq.{partyId}`
- **Events**: INSERT, DELETE
- **Action**: Re-fetch roster via `fetchUserParty()`
- **Consumer**: `PartyRoster`

### useRealtimeRaidBoss
- **Table**: `raid_damage`
- **Filter**: `raid_id=eq.{raidId}`
- **Events**: INSERT
- **Action**: Re-fetch raid via `fetchActiveRaid()`
- **Consumer**: `RaidBoss`

### useRealtimePartyActivity
- **Table**: `workouts`
- **Filter**: none (filter client-side by party member IDs)
- **Events**: INSERT
- **Action**: Re-fetch activity feed
- **Consumer**: `PartyActivityFeed`

### useRealtimeUserProfile
- **Table**: `users`
- **Filter**: `id=eq.{userId}`
- **Events**: UPDATE
- **Action**: Call `refreshProfile()` on Zustand store
- **Consumer**: `UserProfile`, `Header`

## Hook Shape

```typescript
function useRealtimePartyRoster(partyId: string | null, onUpdate: () => void) {
  useEffect(() => {
    if (!partyId) return
    const supabase = createClient()
    const channel = supabase.channel(`party-roster-${partyId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'party_members',
        filter: `party_id=eq.${partyId}`
      }, () => onUpdate())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [partyId])
}
```

## Supabase Config

Realtime must be enabled on these tables in Supabase dashboard:
- `party_members`
- `raid_damage`
- `workouts`
- `users`

## Out of Scope
- Optimistic UI updates (re-fetch is simpler, guaranteed consistent)
- Shop/inventory/achievements/skills (single-user, low-frequency)
- Presence tracking (who's online)

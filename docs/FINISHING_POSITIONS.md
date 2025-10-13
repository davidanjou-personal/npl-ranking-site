# Finishing Positions Guide

## Overview
Finishing positions determine what percentage of base points a player receives for an event.

## Competitive Finishes
These are considered actual competitive placements:

| Position | Display Name | Points % | Description |
|----------|-------------|----------|-------------|
| `winner` | 1st Place | 100% | Event champion |
| `second` | 2nd Place | 80% | Runner-up |
| `third` | 3rd Place | 60% | Third place |
| `fourth` | 4th Place | 50% | Fourth place |
| `quarterfinalist` | Quarter-Finalist | 30% | Lost in quarter-finals (5th-8th) |
| `round_of_16` | Round of 16 | 20% | Lost in Round of 16 (9th-16th) |

## Non-Competitive Position

| Position | Display Name | Points % | Description |
|----------|-------------|----------|-------------|
| `points_awarded` | Points Awarded | 5% | Participation/pool play/pre-R16 wins |

### When is `points_awarded` Used?

1. **Historic Data**: Old records where specific finish wasn't tracked
2. **Pool Play**: Player won games but didn't advance to Round of 16
3. **Early Rounds**: Player finished 17th or lower in larger tournaments
4. **Participation Points**: 5% base points for competing

### Important Notes

- `points_awarded` is **NOT** included in "Best Finish" calculations on player profiles
- It's the lowest tier of recognition in the points system
- Previously called `event_win` (renamed for clarity)
- CSV imports can use `participation`, `competed`, or `points_awarded` as synonyms

## CSV Import Examples

### Competitive Finish
```csv
player_name,player_code,country,gender,category,finishing_position,event_date,tournament_name,tier
Joey Wild,NPL000000001,Australia,male,mens_mixed_doubles,winner,2024-10-01,Spring Championship,tier2
```

### Points Awarded
```csv
player_name,player_code,country,gender,category,finishing_position,event_date,tournament_name,tier
John Smith,NPL000000002,USA,male,mens_singles,points_awarded,2024-10-01,Spring Championship,tier2
```

### Shorthand Notations (Auto-Normalized)
```csv
# These all map to the same values:
finishing_position,normalized_to
1,winner
2,second
3,third
4,fourth
5-8,quarterfinalist
9-16,round_of_16
17+,points_awarded
participation,points_awarded
competed,points_awarded
event_win,points_awarded
```

## Backend Logic

The edge function `bulk-import-rankings` automatically normalizes finishing positions:
- Numeric values (1-16) → Mapped to appropriate position
- Text values → Normalized via position map
- Missing/invalid values → Default to `points_awarded`
- Old `event_win` values → Converted to `points_awarded` for backward compatibility

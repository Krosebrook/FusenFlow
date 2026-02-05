# Runbook: FlowState Operations

## Incident: "App won't load/blank screen"
**Cause**: Corrupted `localStorage` JSON or failed Service Worker update.
**Fix**: 
1. Open DevTools -> Application -> Clear Storage.
2. Hard reload (Cmd+Shift+R).

## Incident: "AI returns 429 Errors"
**Cause**: API Rate limiting.
**Fix**: The app implements automatic retries. If persistent, check billing status at [Google AI Studio](https://aistudio.google.com/).

## Maintenance: Increasing Storage Quota
LocalStorage is limited to 5MB. If documents grow large:
1. Advise user to export old drafts.
2. Future: Migrate to IndexedDB if 5MB is reached consistently.

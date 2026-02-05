# PWA Specification: FlowState AI

## Installability
FlowState satisfies the Web App Manifest requirements for standalone display. 
- **Icons**: 192x192 (General) and 512x512 (Maskable).
- **Theme Color**: Indigo-600 (`#4f46e5`).

## Offline Capabilities
FlowState follows a **Local-First** philosophy. 
- **App Shell**: The editor UI, fonts, and stylesheets are cached via Service Worker (Stale-While-Revalidate).
- **Documents**: Data is stored in `localStorage` and remains accessible without a network.
- **AI Limitations**: Magic features (Drafting, Inline Edits, Coaching) require an active connection to the Gemini API. If offline, these UI elements will enter a "Disabled" or "Waiting" state.

## Update Strategy
The Service Worker uses `skipWaiting()` and `clients.claim()` to ensure that new versions of the app take effect immediately upon reload. When a significant cache purge is required, the `CACHE_NAME` in `sw.js` must be incremented.

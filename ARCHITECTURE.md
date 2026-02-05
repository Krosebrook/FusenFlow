# Architecture: FlowState AI

## Philosophy
FlowState is a **Local-First AI Writing Environment**. 
- **Privacy**: User drafts remain in `localStorage`. 
- **Resilience**: PWA capabilities allow editing without internet.
- **Thought Partnership**: AI doesn't just "chat"; it modifies the document contextually.

## Core Patterns
1. **Snapshot-Before-Modify**: Every AI transaction creates a state snapshot. This eliminates user anxiety when accepting large refactors.
2. **Exponential Backoff**: API calls to Gemini are wrapped in a retry layer to handle rate limits (429) gracefully.
3. **Optimistic Rendering**: The editor content is reactive and local; AI "refinement" happens out-of-band and patches the state.

## Model Strategy
- **Gemini 3 Pro**: Used for high-reasoning tasks like "Magic Draft".
- **Gemini 2.5 Flash**: Used for latency-sensitive tasks like "Inline Refactor" and background coaching.

## Data Schema
Documents are stored as objects in a JSON array. History is keyed by `docId` to prevent collision and preserve performance.

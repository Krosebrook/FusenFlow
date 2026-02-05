# Product Roadmap: FlowState AI

This roadmap outlines the strategic evolution of FlowState from a single-doc prototype to a production-grade writing platform.

---

## Phase 1: The "Real Writer" Essentials (Weeks 1-4)
*Goal: Remove friction that prevents users from using this as their daily driver.*

1.  **Multi-Document Projects** 🔴 *Critical*
    *   **User Story**: "I want to work on multiple articles without losing my previous scratchpad."
    *   **Tech**: Sidebar file list, UUID-based routing, `useProject` hook.
2.  **Rich Text Support** 🔴 *Critical*
    *   **User Story**: "I need bold, italics, and headers to structure my thoughts."
    *   **Tech**: Migrate `textarea` to a block editor (TipTap or Slate).
3.  **Export Pipeline**
    *   **User Story**: "I need to send this to my boss/blog."
    *   **Tech**: Client-side generation of PDF, Markdown (.md), and Word (.docx).
4.  **Dark Mode**
    *   **User Story**: "I write at night and the white screen hurts my eyes."
    *   **Tech**: `dark:` Tailwind variants, persisted user preference.
5.  **Readability Analytics**
    *   **User Story**: "I need to know my word count and reading level."
    *   **Tech**: Real-time footer stats (Flesch-Kincaid score).

---

## Phase 2: Deep AI Integration (Weeks 5-8)
*Goal: Leverage unique Gemini capabilities (Context, Multimodal) to differentiate.*

6.  **Google Search Grounding**
    *   **User Story**: "I want to cite facts without leaving the editor."
    *   **Tech**: Gemini `google_search_retrieval` tool integration.
7.  **Style Learning ("My Voice")**
    *   **User Story**: "Stop sounding like a robot. Write like *me*."
    *   **Tech**: Analyze past samples to generate a custom system prompt signature.
8.  **Smart Thesaurus**
    *   **User Story**: "I need a better word for 'good', but one that fits this specific sentence."
    *   **Tech**: Context-aware replacement using `gemini-2.5-flash`.
9.  **AI Outline Generator**
    *   **User Story**: "I have a topic but no structure."
    *   **Tech**: Generate a navigational sidebar based on document headings.
10. **Smart Autocomplete**
    *   **User Story**: "I'm stuck on the next sentence."
    *   **Tech**: `Tab` to complete (predictive text) using the last 1000 tokens of context.

---

## Phase 3: Workflow & Polish (Weeks 9-12)
*Goal: Professional tools for editing and reviewing.*

11. **Visual Diffing**
    *   **User Story**: "I want to see exactly what the AI changed before I accept it."
    *   **Tech**: Red/Green highlight view (diff-match-patch algorithm).
12. **Typewriter Focus Mode**
    *   **User Story**: "Keep my cursor centered so I don't crane my neck."
    *   **Tech**: CSS Scroll Snapping / Dynamic padding.
13. **Audio Dictation**
    *   **User Story**: "I want to talk out my draft while walking."
    *   **Tech**: Web Speech API or Gemini Audio-in.
14. **Text-to-Speech (Proofreading)**
    *   **User Story**: "Read it back to me so I can hear awkward phrasing."
    *   **Tech**: ElevenLabs or standard Web Speech synthesis.
15. **Contextual Chat Sidebar**
    *   **User Story**: "I want to discuss the article strategy with the AI."
    *   **Tech**: Chat interface that injects the current document as pinned context.

---

## Phase 4: Infrastructure & Scale (Weeks 13+)
*Goal: Moving from local tool to SaaS platform.*

16. **Cloud Sync (Auth + DB)**
    *   **User Story**: "I want to switch from laptop to phone seamlessly."
    *   **Tech**: Supabase/Firebase integration.
17. **Keyboard Shortcuts Manager**
    *   **User Story**: "I want to trigger AI without touching the mouse."
    *   **Tech**: Global hotkey listener (e.g., `Cmd+J`).
18. **Mobile PWA**
    *   **User Story**: "I want an app icon on my phone."
    *   **Tech**: Manifest.json, Service Workers, Touch gesture handling.
19. **Prompt Templates Library**
    *   **User Story**: "I frequently write LinkedIn posts with the same rules."
    *   **Tech**: UI to save/load specific `WritingContext` presets.
20. **Citation Manager**
    *   **User Story**: "I need to track where these AI facts came from."
    *   **Tech**: Auto-append footnotes when using Grounding features.

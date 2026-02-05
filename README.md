# FlowState AI Writer

**FlowState** is a local-first, AI-augmented writing environment designed to act as a distraction-free editor and a sophisticated thought partner. Unlike generic chat interfaces, FlowState integrates AI directly into the creative workflow through proactive coaching, inline refactoring, and context-aware drafting.

## 🏗 System Architecture

The application is built as a **Client-Side SPA (Single Page Application)**. It relies on a "Bring Your Own Key" (BYOK) model for AI services, ensuring privacy and reducing infrastructure complexity for the MVP.

### Tech Stack
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS (Utility-first, Mobile-first)
- **AI Layer**: Google GenAI SDK (`@google/genai`)
- **Persistence**: LocalStorage (via custom `usePersistence` hook)
- **Icons**: Lucide React

### Core Modules

#### 1. The Editor (`components/Editor.tsx`)
A minimalistic, auto-resizing text area.
- **State**: Controlled component pattern.
- **Interactions**: Tracks text selection (`SelectionRange`) to trigger the "Floating Menu" for inline AI edits.

#### 2. Magic AI Engine (`hooks/useMagicAI.ts`)
The intelligence layer that interfaces with Gemini models.
- **Drafting**: Uses `gemini-3-pro-preview` for high-quality, nuanced generation.
- **Proactive Coaching**: A background debounce loop (4s idle) using `gemini-2.5-flash` to analyze tone, clarity, and goal alignment without interrupting the user.
- **Goal Refinement**: Chain-of-thought prompting to help users clarify vague objectives.

#### 3. Persistence & Time Travel (`services/storage.ts`)
A robust safety net for the creative process.
- **Auto-Save**: Debounced writes to LocalStorage.
- **Snapshotting**: Automatically captures full state versions *before* any AI operation ("Pre-Flight Checks"). This allows users to fearlessly accept AI suggestions knowing they can hit "Undo" (History) to revert.

## 🧠 AI Strategy

We utilize a multi-model approach to balance latency and quality:

| Task | Model | Why? |
| :--- | :--- | :--- |
| **Drafting** | `gemini-3-pro-preview` | Best-in-class reasoning and creative adherence to "Writing Context". |
| **Inline Edits** | `gemini-2.5-flash` | Sub-second latency for quick grammar/style fixes. |
| **Coaching** | `gemini-2.5-flash` | Efficient enough to run in the background repeatedly. |
| **Grounding** | *(Planned)* | Will use `google_search_retrieval` tool for factual checks. |

## 🚀 Setup & Development

1. **Environment Variables**:
   Ensure `process.env.API_KEY` is available with a valid Google GenAI API key.

2. **Project Structure**:
   ```
   src/
   ├── components/    # UI Building blocks (Sidebar, Panels)
   ├── hooks/         # Business logic (AI, Storage, Editor state)
   ├── services/      # Stateless API wrappers (Gemini, LocalStorage)
   └── types.ts       # Shared TypeScript interfaces
   ```

3. **Best Practices**:
   - **No Hallucinations**: UI only shows what the data supports.
   - **Optimistic UI**: Interactions feel instant; AI loads show clear spinners.
   - **Safety First**: Never overwrite user text without a snapshot.

## 📄 License
Proprietary / Internal Tool.

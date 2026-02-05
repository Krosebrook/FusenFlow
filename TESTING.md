# Testing Strategy

## 17+ Critical Test Suites
1. **Document CRUD**: Create, Update, Delete documents in sidebar.
2. **Snapshot Creation**: Verify snapshot occurs before AI edits.
3. **Snapshot Restore**: Verify text returns exactly to previous state.
4. **Magic Mode Toggle**: Verify background analysis starts/stops.
5. **Dark Mode Persistence**: Verify theme remains after refresh.
6. **Large Doc Performance**: Typing latency with 10k+ words.
7. **PWA Offline Load**: Verify app loads with wifi disabled.
8. **Export (MD)**: Check Markdown formatting of export.
9. **Export (TXT)**: Check plain text export.
10. **Gemini 429 Recovery**: Verify retries work on rate limit.
11. **Gemini 500 Failure**: Verify ErrorBoundary catches API crashes.
12. **Selection Logic**: Verify menu appears on valid text selection.
13. **Goal Refinement**: Verify Wand icon returns 3 suggestions.
14. **Image Attachments**: Verify images are sent to Gemini correctly.
15. **Text Attachments**: Verify .txt files are base64-decoded for AI.
16. **Reading Time Calculation**: Verify accuracy for slow/fast readers.
17. **Mobile Responsiveness**: Sidebar behavior on iPhone/Android.

## Running Tests
```bash
# Manual Smoke Check
npx ts-node scripts/smoke-check.ts
```

# Observability & Metrics

## Release Tracking
- Track Service Worker registration success rates via custom telemetry (e.g., Google Analytics or Sentry).

## Performance Metrics
- **FCP (First Contentful Paint)**: Target < 1.2s.
- **AI Turnaround**: Track average seconds for `gemini-3-pro-preview` draft responses.

## Error Reporting
- Wrap `ai.models.generateContent` in an error boundary to track 429 (Rate Limit) or 503 (Overloaded) errors.

# Security Policy: FlowState AI

## Threat Model
1. **API Key Exposure**: As a client-side app, the `API_KEY` is visible in the network tab.
   - *Mitigation*: Users must use restricted API keys. In enterprise deployments, use a Proxy API.
2. **Local Data Theft**: Physical access to the device allows reading LocalStorage.
   - *Mitigation*: Leverage device-level encryption (FileVault/BitLocker).
3. **Prompt Injection**: User instructions could attempt to trick the AI into returning malformed JSON.
   - *Mitigation*: Strict schema validation on AI responses.

## Compliance
- **GDPR**: Data never leaves the client except for transient AI processing. Google Gemini's privacy terms apply to the transit data.

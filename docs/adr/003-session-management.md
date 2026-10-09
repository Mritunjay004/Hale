# ADR 003: Frictionless Device-Bound Anonymous Sessions

- **Context:** Requiring email/password/OTP on Day 1 causes 60%+ onboarding abandonment; users want to test health guidance immediately.
- **Decision:** On initial launch, generate a high-entropy device secret, call `POST /sessions`, and persist the session token in `expo-secure-store` (mobile) and local secure storage (web).
- **Rationale:** Delivers instant zero-friction onboarding while maintaining clean relational integrity in PostgreSQL (`users.id`). Eliminates auth walls and password reset headaches.
- **Consequences:** Account is bound to the device keystore. Production upgrade path allows linking Google/Apple OAuth or phone OTP without changing database keys.


# ADR 004: Offline Strategy and Local Smart Notifications

- **Context:** Mobile users log meals in low-connectivity areas (basement gyms, grocery aisles) and need timely nudges without complex APNs/FCM server push infrastructure.
- **Decision:** Use TanStack Query with persistent offline cache + an optimistic mutation queue with idempotency keys; implement proactive nudges via `expo-notifications` scheduled on-device based on learned median meal times.
- **Rationale:** Instant cold-start rendering (< 1s) from cache. Local scheduling requires zero server push infra while fully honoring quiet hours (22:00-07:00) and cancellation on meal log.
- **Consequences:** Food logging never fails due to transient connection drops; notification logic is completely self-contained and battery-friendly.


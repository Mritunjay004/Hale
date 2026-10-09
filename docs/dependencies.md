# Dependency Log & Bundle Impact Justification

Per project rule 4, every third-party package introduced into Hale must be justified with its purpose, bundle impact, and alternatives considered.

---

## Shared Workspace (`packages/shared`)

| Package | Purpose | Why Chosen / Bundle Impact |
|---|---|---|
| `zod` | Runtime schema validation & type inference | Single source of truth for API contracts, AI structured responses, and forms. Tree-shakeable, ~14 kB gzipped. |

---

## API Service (`apps/api`)

| Package | Purpose | Why Chosen / Alternatives Considered |
|---|---|---|
| `fastify` | High-performance HTTP/SSE server | 2–3x faster than Express, native schema compilation support, first-class TypeScript types, clean plugin architecture. |
| `fastify-cors` | Cross-origin resource sharing | Enables Expo Web and dev clients to query the API. Lightweight plugin. |
| `fastify-multipart` | Multipart file upload parsing | In-memory streaming of plate photos and lab report PDFs for multimodal AI evaluation without writing files to disk. |
| `drizzle-orm` | TypeScript SQL ORM | Zero heavy query engine binaries (unlike Prisma ~40MB engine). Emits pure, predictable SQL with compile-time type safety. |
| `postgres` / `pg` | PostgreSQL client driver | Fast native node Postgres connection driver. |
| `@google/genai` | Google Gemini API SDK | Official modern client for Gemini Flash multimodal and structured JSON extraction. |
| `groq-sdk` | Groq fast inference SDK | Official ultra-fast inference SDK for Whisper-large-v3 transcription and Llama-3 fallback. |
| `pino` | Fast structured JSON logging | Built-in with Fastify, negligible runtime overhead, produces structured logs with request-ids. |
| `dotenv` | Environment variable loader | Standard 12-factor configuration management. |

---

## Mobile & Web Client (`apps/mobile`)

| Package | Purpose | Why Chosen / Alternatives Considered |
|---|---|---|
| `expo-router` | File-based typed routing | Native cross-platform navigation for iOS, Android, and Web. Replaces boilerplate React Navigation navigators. |
| `@tanstack/react-query` | Server state & caching | Eliminates manual fetch effects, provides automatic cache invalidation, offline cache persistence, and optimistic updates. |
| `zustand` | Transient client UI state | Tiny (~1 kB) state manager for modal visibility, active capture modes, and audio recording state. Avoids Redux overhead. |
| `react-native-svg` | Lightweight vector charts | Powers custom calorie rings, sparklines, range bars, and trend charts. Far smaller bundle footprint (< 300 kB) than bulky charting libraries like Victory or Chart.js. |
| `expo-haptics` | Tactile feedback | Essential for micro-delights on meal save and ring closure. Native Expo module. |
| `expo-image` | High-performance image rendering | Caching, blurhash, memory management, faster than RN Image. |
| `expo-image-picker` / `expo-camera` | Photo capture for food and lab reports | Native camera and gallery access with built-in compression. |
| `expo-audio` | Audio recording for voice logging | Modern audio recording API with permission handling and stream creation. |
| `expo-notifications` | On-device smart nudges | Enables battery-efficient, reliable local reminder scheduling without requiring server-driven APNs/FCM push infrastructure. |
| `expo-secure-store` | Keystore session storage | Hardware-backed encrypted storage for anonymous session tokens on iOS and Android. |
| `@gorhom/bottom-sheet` | Mobile bottom sheet | Butter-smooth 60fps gesture-driven sheets for capture and meal editing. |
| `lottie-react-native` | Tasteful micro-delight animations | Vector animation runtime for key celebratory milestones (day goal completion, streak milestones, checkmarks). Far smaller than GIFs (< 25 kB JSON assets) with 60fps native performance. |

---

## Explicitly Excluded Packages (Bundle & Bloat Protection)
- **Redux / Redux Toolkit:** Excluded. TanStack Query + Zustand handles server and UI state with 90% less boilerplate.
- **Victory / Chartkick / Highcharts:** Excluded. Bulky bundle impact (> 2 MB). Replaced by lightweight, hand-crafted SVG primitives (`react-native-svg`).
- **Moment.js:** Excluded. Replaced by native JavaScript `Intl` and minimal standard date helpers.


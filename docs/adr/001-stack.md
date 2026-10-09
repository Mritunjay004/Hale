# ADR 001: Core Architecture and Technology Stack

- **Context:** Need a fast, unified, cross-platform mobile and web application with high reliability within a 2-day build window.
- **Decision:** Expo (React Native + Expo Router) for frontend; Node.js with Fastify for backend; PostgreSQL with Drizzle ORM; strict TypeScript across a monorepo (`apps/mobile`, `apps/api`, `packages/shared`).
- **Rationale:** 
  1. Expo Router enables shared responsive screens (mobile bottom sheets, desktop modals) from one codebase.
  2. Fastify has lower overhead and cleaner schema validation integration (Zod) than NestJS/Express.
  3. Drizzle provides zero-cost TypeScript type safety with explicit SQL migrations.
- **Consequences:** Team writes unified schemas in `packages/shared`; bundle size remains under 40 MB.


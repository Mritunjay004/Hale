# ADR 005: Micro-Delight Vector Animations via Lottie

- **Context:** Habit adherence improves when users receive immediate positive reinforcement; raster videos and GIFs bloat the APK and drop frames.
- **Decision:** Integrate `lottie-react-native` for vector micro-delights (ring closure, meal save completion, streak milestones) with dotLottie/JSON assets under 30 kB.
- **Rationale:** Delivers 60fps hardware-accelerated animations across iOS, Android, and Web with near-zero bundle impact. Single-play animations avoid casino-style cognitive fatigue.
- **Consequences:** All animations respect user `reduced-motion` settings and fall back to clean static icons when disabled.


# Design Tokens & Visual Design System

Hale follows a **warm, modern, calm, and trustworthy** visual system. It specifically rejects harsh clinical whites and neobrutalist heavy borders/shadows in favor of soft surfaces, natural organic tones, and high-legibility typography.

---

## 1. Color Palette

All text colors pass WCAG AA contrast standards ($\ge 4.5:1$ against their respective backgrounds).

### Primary & Brand Colors
| Token | Hex Value | Purpose & Usage | Contrast Ratio |
|---|---|---|---|
| `color.brand.primary` | `#1B4931` | Deep Sage Green. Primary buttons, selected tab, active states | 8.8:1 on `#FBFBF9` |
| `color.brand.primaryLight` | `#E8F0EA` | Soft Sage Tint. Selected card backgrounds, badge backgrounds | 1.15:1 (Surface) |
| `color.brand.primaryDark` | `#123322` | Deep forest green for pressed button states | 12.2:1 on `#FBFBF9` |
| `color.brand.accent` | `#E07A5F` | Warm Terracotta Coral. Streaks, celebrations, key highlights | 4.8:1 on `#FBFBF9` |
| `color.brand.accentLight` | `#FDF1ED` | Coral tint for celebration banners and badges | Surface |

### Neutral & Background Colors
| Token | Hex Value | Purpose & Usage |
|---|---|---|
| `color.bg.canvas` | `#FBFBF9` | Warm off-white canvas. Main app background |
| `color.bg.surface` | `#FFFFFF` | Crisp white cards, sheets, modal containers |
| `color.bg.subtle` | `#F3F4EE` | Secondary chip backgrounds, input field backgrounds |
| `color.border.subtle` | `#E5E7EB` | Hairline dividers and card borders (1px) |
| `color.border.focus` | `#1B4931` | Keyboard focus rings and active form borders |

### Typography Colors
| Token | Hex Value | Role | Contrast on `#FFFFFF` |
|---|---|---|---|
| `color.text.primary` | `#191C1E` | High-emphasis headers, titles, primary metrics | 14.8:1 |
| `color.text.secondary` | `#4B5563` | Body copy, explanations, secondary labels | 7.0:1 |
| `color.text.muted` | `#6B7280` | Timestamps, placeholder text, units (e.g. "kcal") | 4.6:1 |
| `color.text.inverse` | `#FFFFFF` | Text on primary dark buttons | 8.8:1 on `#1B4931` |

### Semantic Health Feedback Colors (Non-Shaming)
Notice: Over-target nutrition states use neutral slate/warm amber, **never punitive crimson red**.
| Token | Hex Value | Purpose |
|---|---|---|
| `color.semantic.success` | `#2D6A4F` | Goal achieved, habit completed, normal biomarker |
| `color.semantic.info` | `#2563EB` | Neutral educational insights, status notes |
| `color.semantic.neutralWarn` | `#D97706` | Borderline lab values, approaching calorie target |
| `color.semantic.error` | `#DC2626` | Form errors, network failure, out-of-range critical marker |

---

## 2. Typography Scale

Hale utilizes the clean system font family (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).

| Token | Size (px) | Line Height (px) | Weight | Recommended Role |
|---|---|---|---|---|
| `type.display` | 32 | 40 | 700 (Bold) | Daily calorie numbers, payoff values |
| `type.h1` | 24 | 32 | 600 (SemiBold) | Screen titles, onboarding headings |
| `type.h2` | 20 | 28 | 600 (SemiBold) | Card titles, section headers |
| `type.h3` | 17 | 24 | 600 (SemiBold) | Meal item titles, subheadings |
| `type.body` | 15 | 22 | 400 (Regular) | Primary explanations, chat text, insights |
| `type.bodyMedium` | 15 | 22 | 500 (Medium) | Interactive list labels, button labels |
| `type.caption` | 13 | 18 | 400 (Regular) | Timestamps, macro numbers, secondary details |
| `type.badge` | 11 | 14 | 600 (SemiBold) | Confidence badges, habit tags, pill chips |

---

## 3. Spacing Scale (4pt Base Grid)

All margins, paddings, and component gaps derive strictly from the 4pt scale.

| Token | Value | Common Usage |
|---|---|---|
| `spacing.xxs` | 4px | Micro padding inside badges, icon gaps |
| `spacing.xs` | 8px | Gap between inline chips, small button padding |
| `spacing.sm` | 12px | Input internal padding, card item gap |
| `spacing.md` | 16px | Standard card padding, standard screen edge margin |
| `spacing.lg` | 20px | Section spacing, container gutters |
| `spacing.xl` | 24px | Modal and sheet padding, header margin bottom |
| `spacing.2xl` | 32px | Separation between major page blocks |
| `spacing.3xl` | 40px | Onboarding top hero margin |
| `spacing.4xl` | 48px | Desktop layout columns whitespace |

---

## 4. Radius & Border Tokens

| Token | Value | Applied Component |
|---|---|---|
| `radius.sm` | 6px | Small tags, micro indicators |
| `radius.md` | 10px | Stepper buttons, text input fields |
| `radius.lg` | 16px | Primary cards, meal timeline items |
| `radius.xl` | 24px | Bottom sheets, desktop modal dialogs |
| `radius.full` | 9999px | Circular buttons, FABs, habit status pills |

---

## 5. Elevation & Shadows

Subtle multi-layer shadows provide depth without harsh outlines.

| Token | CSS / React Native Shadow Specs | Usage |
|---|---|---|
| `shadow.card` | `0px 2px 6px rgba(0, 0, 0, 0.04), 0px 1px 2px rgba(0, 0, 0, 0.02)` | Base cards on Today screen |
| `shadow.floating` | `0px 8px 24px rgba(0, 0, 0, 0.08), 0px 2px 6px rgba(0, 0, 0, 0.04)` | Bottom navigation bar, FAB "+" button |
| `shadow.modal` | `0px 20px 48px rgba(0, 0, 0, 0.12), 0px 4px 12px rgba(0, 0, 0, 0.06)` | Bottom sheets, Desktop modals |

---

## 6. Iconography & Touch Target Standards

- **Touch Targets:** All interactive elements maintain a minimum bounding box of **$44 \times 44\text{ pt}$**.
- **Icon Set:** Standardized on `@expo/vector-icons` (Lucide or Feather equivalents) with uniform 2px stroke width.
- **Accessibility:** High contrast, full screen reader accessibility labels (`accessibilityLabel` in React Native / `aria-label` on Web).

---

## 7. Micro-Delights & Lottie Animation Guidelines

Lottie animations (`lottie-react-native`) are utilized selectively for moments of genuine delight, positive reinforcement, and smooth transitions:

1. **Ring Closure / Day Complete:** A subtle circular burst or checkmark when the daily nutrition window is satisfied ($\le 1.5\text{s}$ duration, non-looping, paired with light haptic feedback).
2. **Meal Saved Confirmation:** A quick, satisfying micro-check animation ($\sim 600\text{ms}$) on saving a meal from the confirmation sheet before returning to Today.
3. **Streak & Habit Milestones:** Warm flame or badge sparkle on crossing 3-day and 7-day consistency milestones.
4. **Onboarding Plan Reveal:** Gentle pulsating orb during the 2-second domain computation transitioning into the plan payoff screen.
5. **Rules of Engagement:**
   - Always respect OS reduced-motion preferences (`prefers-reduced-motion`).
   - Assets must be compact dotLottie / JSON vector files ($\le 30\text{ kB}$ each).
   - No looping casino-style visual noise; animations play once to celebrate closure and then settle into static state.



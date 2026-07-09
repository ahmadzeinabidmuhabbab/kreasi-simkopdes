---
name: KREASI Design System
colors:
  surface: '#f9faf1'
  surface-dim: '#d9dbd2'
  surface-bright: '#f9faf1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4ec'
  surface-container: '#edefe6'
  surface-container-high: '#e7e9e0'
  surface-container-highest: '#e2e3db'
  on-surface: '#1a1c17'
  on-surface-variant: '#42493d'
  inverse-surface: '#2e312c'
  inverse-on-surface: '#f0f1e9'
  outline: '#72796c'
  outline-variant: '#c2c9ba'
  surface-tint: '#3d692d'
  primary: '#2e591f'
  on-primary: '#ffffff'
  primary-container: '#467235'
  on-primary-container: '#c2f5a9'
  inverse-primary: '#a2d48c'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffbf00'
  on-secondary-container: '#6d5000'
  tertiary: '#3e5638'
  on-tertiary: '#ffffff'
  tertiary-container: '#556e4f'
  on-tertiary-container: '#d3efc8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bef1a5'
  primary-fixed-dim: '#a2d48c'
  on-primary-fixed: '#042100'
  on-primary-fixed-variant: '#265017'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#fbbc00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#ceebc4'
  tertiary-fixed-dim: '#b3cea9'
  on-tertiary-fixed: '#0a2008'
  on-tertiary-fixed-variant: '#354d30'
  background: '#f9faf1'
  on-background: '#1a1c17'
  surface-variant: '#e2e3db'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system for KREASI embodies the spirit of a modern rural cooperative: deeply rooted in community yet powered by cutting-edge technology. The brand personality is **Innovative, Transparent, Cooperative, and Reliable**. 

The design style is a blend of **Corporate Modern** and **Glassmorphism**. It utilizes high-quality whitespace and structured layouts to convey reliability, while integrating frosted glass effects and subtle blurs specifically for AI-driven features to signal innovation. The interface prioritizes clarity to ensure accessibility for rural users while maintaining a sophisticated tech-forward aesthetic that invites investment and trust.

## Colors
The palette is inspired by natural growth and financial prosperity. 

- **Primary (Forest Green):** Used for main actions, active states, and brand-heavy components. It represents stability and the agricultural roots of the cooperative.
- **Secondary (Amber):** Used for highlights, warnings, and secondary call-to-actions. It adds warmth and energy.
- **Accent (Deep Dark Green):** Reserved for deep-depth backgrounds, text contrast, and high-level navigation headers.
- **Light (Soft Yellow):** Employed for background tints, card fills, and celebratory states to maintain a friendly, approachable atmosphere.
- **Neutral:** A range of cool grays (from #F8F9FA to #212529) ensures high legibility and a clean structural foundation.

## Typography
The design system utilizes **Inter** exclusively to ensure a clean, systematic, and highly readable experience across all digital touchpoints. 

- **Headlines:** Use Semi-bold (600) or Bold (700) weights with tighter letter spacing for a compact, authoritative look.
- **Body Text:** Use Regular (400) weight for maximum legibility in financial reports and cooperative data.
- **Data Labels:** Use the `label-md` style for metadata, table headers, and small UI descriptors to maintain organizational clarity.
- **Mobile Scaling:** Display styles must drop in size on mobile devices to prevent excessive wrapping while maintaining hierarchy.

## Layout & Spacing
The layout follows a **Fluid Grid** philosophy with a maximum container width of 1280px for desktop. 

- **Grid:** A 12-column system is used for desktop, 8-column for tablet, and 4-column for mobile.
- **Rhythm:** Spacing is strictly based on an 8px scale.
- **Safe Areas:** A minimum outer margin of 24px (md) is required for mobile devices, expanding to 40px (lg) on desktop to provide breathing room and a premium feel.
- **Vertical Spacing:** Use `xl` spacing to separate major content sections and `md` spacing for grouping related components within a section.

## Elevation & Depth
This design system uses a combination of **Tonal Layers** and **Glassmorphism** to establish hierarchy:

1.  **Level 0 (Base):** Soft gray (#F8F9FA) background.
2.  **Level 1 (Cards/Containers):** Pure white surfaces with a subtle 1px border (#E9ECEF) and a soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)).
3.  **Level 2 (Popovers/Modals):** More pronounced shadows and backdrop blurs to pull the element forward.
4.  **AI/Innovation Layer:** For AI-assisted ecosystem features, use a semi-transparent white background with a 12px backdrop blur and a thin, vibrant Forest Green inner border to signify active intelligence.

## Shapes
The shape language is approachable and modern, utilizing **Rounded** corners to soften the industrial nature of financial tools.

- **Base Radius:** 0.5rem (8px) for standard components like input fields and small buttons.
- **Large Radius:** 1rem (16px) for cards, content containers, and featured sections.
- **Extra Large Radius:** 1.5rem (24px) for prominent hero elements and modal wrappers.
- **Pill-shape:** Applied to status chips and decorative tags to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Forest Green background, White text, 8px border radius. Heavy focus on 16px horizontal padding.
- **Secondary:** White background with 2px Forest Green border.
- **Tertiary:** Amber background with Deep Dark Green text for high-priority alerts or specific "action required" states.

### Cards & Data Visualization
- **Cards:** White fill, 16px rounded corners, subtle shadow. Use Soft Yellow (#FFF78D) as a header background tint for "Success" or "Cooperative Milestone" cards.
- **Charts:** Use Forest Green for primary data series, Amber for secondary benchmarks, and Deep Dark Green for target lines. Ensure clean, sans-serif labeling.

### Inputs & Form Elements
- **Fields:** 8px border radius, light gray border. Active state uses a 2px Forest Green outline with a soft green glow.
- **Checkboxes:** Square with 4px radius, filling with Forest Green when checked.

### AI Sections (Glassmorphism)
- Elements related to AI forecasting or automated cooperative insights should feature a 60% opacity white fill with a `backdrop-filter: blur(10px)`.

### Lists & Navigation
- **Navigation:** Horizontal top-bar with Forest Green active indicators.
- **Lists:** Clean row-based layouts with 1px dividers and generous vertical padding (16px) for touch accessibility.
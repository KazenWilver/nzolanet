---
version: alpha
name: Raycast Dark Interface
description: A minimal, high-contrast dark productivity system with soft metallic highlights and understated neon accenting.
colors:
  primary: "#FFFFFF"
  secondary: "#9C9C9D"
  tertiary: "#E6E6E6"
  neutral: "#07080A"
  surface: "#0B0C0E"
  on-surface: "#FFFFFF"
  error: "#FF6B6B"
  primary-60: "#E6E6E6"
  primary-70: "#D1D1D1"
  border-subtle: "#FFFFFF0F"
  border-strong: "#2F3031"
  accent-warm: "#D7C9AF"
typography:
  headline-display:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: 600
    lineHeight: 70.4px
    letterSpacing: 0px
  headline-lg:
    fontFamily: Inter
    fontSize: 47px
    fontWeight: 500
    lineHeight: 56px
    letterSpacing: 0.2px
  headline-md:
    fontFamily: Inter
    fontSize: 34px
    fontWeight: 500
    lineHeight: 41px
    letterSpacing: 0.2px
  headline-sm:
    fontFamily: Inter
    fontSize: 25px
    fontWeight: 500
    lineHeight: 38.4px
    letterSpacing: 0.2px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.2px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.2px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.2px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.1px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.1px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.1px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 6px
  sm: 14px
  md: 24px
  lg: 48px
  xl: 120px
  gutter: 24px
  section: 120px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.border-strong}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-70}"
    textColor: "{colors.border-strong}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.border-strong}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Raycast Dark Interface

## Overview
Raycast presents a sleek, command-oriented dark interface for power users and productivity-minded professionals. The tone is confident, minimal, and technically refined, with a strong emphasis on speed and clarity over decoration. The layout feels spacious and deliberate, letting a small number of high-impact elements carry the page.

## Colors
- **Primary (#FFFFFF):** Pure white used for the most important text, icons, and call-to-action emphasis. It creates the crisp, high-contrast feel that defines the brand.
- **Secondary (#9C9C9D):** A muted cool gray used for navigation links, secondary copy, and subdued affordances. It keeps the interface calm without reducing legibility too far.
- **Tertiary (#E6E6E6):** A soft silver surface used for buttons and raised interactive controls. It gives the UI a metallic, premium quality against the dark backdrop.
- **Neutral (#07080A):** The near-black base background used across the page and cards. It provides the immersive, low-distraction canvas that makes the bright text and controls stand out.
- **Surface (#0B0C0E):** A slightly lifted dark surface tone for subtle layering when elements need separation without visible contrast jumps.
- **On-surface (#FFFFFF):** The default foreground color on dark surfaces, ensuring maximum readability.
- **Border-subtle (#FFFFFF0F):** A barely-there translucent border used to define panels and containers with restraint.
- **Border-strong (#2F3031):** A dark charcoal used for button text and stronger structural contrast inside light controls.
- **Accent-warm (#D7C9AF):** A faint warm glow tone that appears in soft shadows and atmospheric highlights, adding a premium, organic warmth to the otherwise cool system.
- **Error (#FF6B6B):** Reserved for destructive states and validation feedback; it should remain visually restrained to preserve the calm aesthetic.

## Typography
Inter is the only type family and should be used consistently across headlines, body copy, labels, and UI chrome. Headlines use medium to semi-bold weights, with a clear step-down between display, section, and supporting hierarchy; body copy is lighter and highly readable. Letter spacing is subtle and slightly open in smaller text, while uppercase styling is not a dominant pattern in the observed interface.

- **Display and headings:** `headline-display` and `headline-lg` are the centerpiece styles for hero messaging. Use them for short, declarative statements that need strong presence.
- **Section headings:** `headline-md` and `headline-sm` handle supporting hierarchy in feature sections, cards, and modal-like surfaces.
- **Body text:** `body-lg`, `body-md`, and `body-sm` should keep a relaxed rhythm with compact line lengths and minimal ornament.
- **Labels and controls:** `label-lg`, `label-md`, and `label-sm` are used for buttons, navigation, metadata, and utility text. Medium weight keeps controls feeling crisp without becoming heavy.

## Layout & Spacing
The page uses a centered, fixed-max-width composition with a lot of negative space around the primary message. Horizontal alignment is disciplined and symmetrical, while the vertical rhythm is generous enough to support a calm, premium presentation. Spacing follows a clean scale: `xs` for micro-gaps, `sm` for control padding and small separations, `md` for content grouping, `lg` for section breathing room, and `xl`/`section` for major vertical resets.

Container padding should remain consistent and conservative, with `gutter`-level spacing used to separate inline groups such as navigation items and button clusters. Cards and panels should typically use `24px` internal padding, with sections separated by broad vertical space rather than dense stacking.

## Elevation & Depth
The interface is intentionally low-elevation and mostly flat. Depth comes from subtle borders, inner highlights, and restrained shadows rather than heavy drop shadows or large blur systems. Light buttons appear slightly raised through contrast and inset sheen, while dark cards depend on a fine translucent border and a quiet inner highlight to separate them from the background.

Use shadow sparingly: small controls may use a soft shadow for tactile clarity, but large surfaces should remain nearly flat. The result should feel precise, premium, and engineered rather than glossy or playful.

## Shapes
The overall shape language is rounded but disciplined. Small interactive elements use an 8px radius, cards use a 12px radius, and pills use full rounding to signal lightweight metadata or auxiliary actions. Corners should feel friendly and refined, never bubbly; geometry stays rectilinear and restrained.

## Components
Buttons are the most visually expressive component in the system. Primary and secondary buttons share the same light silver treatment with dark text, `8px 12px` padding, and a `36px` height, which gives them a compact, command-like feel. The primary state should feel the most prominent through contrast and placement rather than by changing shape; hover states may slightly adjust to a softer or brighter silver tone. Link buttons should remain text-only, muted in `secondary`, and underlined for clear non-primary action signaling.

Cards should use the `card` treatment: dark background, `12px` radius, subtle border, and `24px` padding. Keep card content sparse and well-spaced, with typography doing most of the work. Inputs should follow the same quiet geometry as buttons, with dark surfaces, understated borders, and compact internal padding.

Chips and utility pills should be minimal, transparent or low-fill, and use small type with full rounding. They work best for metadata, release tags, or secondary filters. Navigation links should remain lightweight and subdued, only becoming brighter on emphasis or hover.

## Do's and Don'ts
- Do keep the page feeling spacious and centered, with one dominant focal point per screen.
- Do use Inter consistently across all text styles and UI controls.
- Do prefer soft borders and inner highlights over dramatic shadows.
- Do reserve bright white for the most important text and actions.
- Don't introduce colorful gradients, loud accent palettes, or playful illustration treatments.
- Don't increase border radius beyond the existing restrained system unless creating a deliberate pill.
- Don't overcrowd the layout with dense blocks of text or too many competing CTAs.
- Don't make secondary text too faint to read on the near-black background.
---
version: alpha
name: Dust
description: A bright, product-led SaaS system with airy spacing, strong blue accents, and friendly editorial typography.
colors:
  primary: "#1C91FF"
  primary-strong: "#1678D9"
  primary-soft: "#E9F7FF"
  secondary: "#111418"
  tertiary: "#2A3241"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  surface-muted: "#F8FAFC"
  on-surface: "#111418"
  on-surface-muted: "#5B6472"
  border: "#E5E7EB"
  border-soft: "#EEEEEF"
  accent-warm: "#FFD6E7"
  accent-lime: "#DDF56A"
  accent-sky: "#9ED7FF"
  error: "#E5484D"
typography:
  headline-display:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: 550
    lineHeight: 1
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 45px
    fontWeight: 550
    lineHeight: 54px
    letterSpacing: -1.8px
  headline-md:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: 550
    lineHeight: 43px
    letterSpacing: -0.96px
  headline-sm:
    fontFamily: Geist
    fontSize: 29px
    fontWeight: 550
    lineHeight: 30px
    letterSpacing: -0.96px
  headline-xs:
    fontFamily: Geist
    fontSize: 23px
    fontWeight: 550
    lineHeight: 28px
    letterSpacing: 0px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: 400
    lineHeight: 27.9px
    letterSpacing: -0.02em
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  label-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 550
    lineHeight: 1.3
    letterSpacing: 0px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: 0.02em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 24px
  full: 9999px
spacing:
  xs: 6px
  sm: 16px
  md: 28px
  lg: 48px
  xl: 64px
  gutter: 80px
  section: 120px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "36px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Dust

## Overview

Dust feels polished, optimistic, and highly product-led. The page uses a very light canvas, strong blue call-to-action color, and generous whitespace to create a calm, premium SaaS impression rather than a dense enterprise dashboard. Typography is large and assertive, while the illustration adds playful color and motion without overwhelming the interface.

## Colors

- **Primary (#1C91FF):** The signature action blue used for major CTAs, the announcement bar, and interactive emphasis. It should feel energetic and trustworthy.
- **Primary Strong (#1678D9):** A slightly deeper blue reserved for hover and active states so interactions feel crisp without changing the brand tone.
- **Primary Soft (#E9F7FF):** A pale blue wash for supportive button text or low-emphasis interactive backgrounds.
- **Secondary (#111418):** The near-black used for the main headline text and strongest content hierarchy.
- **Tertiary (#2A3241):** A deep slate for navigation, supporting copy, and secondary buttons.
- **Neutral (#FFFFFF):** The dominant base color for the page and most elevated surfaces.
- **Surface (#FFFFFF):** Cards and UI chrome sit on the same white family, reinforcing the airy look.
- **Surface Muted (#F8FAFC):** A subtle off-white for soft paneling or secondary sections when separation is needed.
- **On Surface (#111418):** Primary readable text color on light backgrounds.
- **On Surface Muted (#5B6472):** Used for body copy, metadata, and quiet UI labels.
- **Border (#E5E7EB):** A light neutral divider for cards, inputs, and subtle framing.
- **Border Soft (#EEEEEF):** Even softer outline treatment for fine button edges and quiet separators.
- **Accent Warm (#FFD6E7):** A playful pink accent seen in the illustration language and supporting highlights.
- **Accent Lime (#DDF56A):** A bright chartreuse accent that adds energy to the 3D scene and brand artwork.
- **Accent Sky (#9ED7FF):** A light blue accent for illustration surfaces and secondary visual contrast.
- **Error (#E5484D):** Reserved for validation and destructive states; it is not visually dominant in the screenshot.

## Typography

Dust uses Geist across the interface, creating a modern, compact, and clean SaaS voice. Headings are weighted at 550, which reads as confident but not overly heavy, and they use tight negative letter-spacing for a sharp editorial feel. Body text is lighter and more open, with enough line height to keep the hero copy readable at large sizes.

- **Headline-display / headline-lg / headline-md:** For major marketing statements and hero headlines. These should be large, tightly tracked, and stacked in short lines.
- **Headline-sm / headline-xs:** For section titles, card headings, and smaller high-importance labels.
- **Body-lg:** Used for the hero paragraph and other lead explanatory copy; it should stay spacious and readable.
- **Body-md / body-sm:** For navigation, ancillary descriptions, cookies text, and supportive UI copy.
- **Label-lg / label-md / label-sm:** For buttons, chips, announcement badges, and other UI controls. Labels are mostly sentence case rather than all-caps, keeping the brand friendly and accessible.

## Layout

The layout relies on a wide, fluid desktop canvas with a strong left-aligned text column and a large right-side illustration. Content is spaced generously, with a clear vertical rhythm driven by the 6px, 16px, 28px, 48px, and 64px spacing scale. Sections should breathe; avoid compressing elements too tightly, especially in hero and marketing blocks.

Navigation sits at the top with ample horizontal padding, and the primary hero is framed by large margins that keep the design feeling spacious rather than grid-heavy. Cards and UI containers should use moderate internal padding, while page sections can expand to 120px rhythm when building longer landing pages.

## Elevation & Depth

Elevation is intentionally restrained. The interface is mostly flat, with hierarchy created through contrast, white space, and thin borders instead of strong shadow stacks. Where depth appears, it is subtle and soft, like the floating cookie banner and the illustrated 3D scene.

Use borders such as Border (#E5E7EB) and Border Soft (#EEEEEF) to define surfaces before reaching for shadow. If shadow is needed, keep it light and diffused so the system stays airy and modern.

## Shapes

The shape language is rounded but disciplined. Buttons use 12px radii, cards use 8px to 12px radii, and the pill/chip language leans fully rounded. This creates a friendly, contemporary feel without becoming bubbly or overly playful.

The overall silhouette should remain soft-edged and approachable. Reserve the full radius for badges, chips, and compact pills, and keep larger surfaces subtly rounded.

## Components

### Buttons
- **Primary button (`button-primary`):** Solid blue CTA with white text. Use for the strongest action, such as “Request a demo” or “Contact sales.” Keep it compact at around 36px height with 10px 12px padding.
- **Primary hover (`button-primary-hover`):** Darken to Primary Strong (#1678D9) on hover for a clear interactive affordance.
- **Secondary button (`button-secondary`):** White or neutral background with a light border and dark text. Use for lower-priority but still important actions like “Try for free.”
- **Link button (`button-link`):** Bare, text-only action with no container. Use for navigation-like CTAs and inline affordances.
- Buttons should remain medium-weight, sentence case, and minimally embellished.

### Cards
- **Card (`card`):** White surface with a subtle border and 8px rounded corners. Padding should be comfortable but not excessive so cards feel structured and airy.
- Cards should avoid heavy shadows; prefer border definition and content spacing.

### Inputs
- Inputs should follow the same white surface and subtle border language as cards.
- Corners should match the card system, and focus states should rely on the blue primary rather than decorative outlines.
- Keep fields compact, readable, and aligned with the button height rhythm.

### Chips and badges
- Chips should be fully rounded, small, and lightly bordered or softly surfaced.
- The announcement badge style is concise and functional: tiny pill, strong label, and a clear contrast accent.
- Use chips to annotate status or context, not as primary navigation.

### Navigation
- Top navigation links are quiet, medium-size, and spaced generously.
- Dropdown indicators are subtle and should not compete with the content.
- The header should remain clean, with the logo and actions separated by ample white space.

### Announcement bar and cookie banner
- The announcement bar uses the primary blue as a full-width attention strip with centered text.
- The cookie banner is dark and grounded, creating strong contrast against the otherwise light page; it should feel temporary and utilitarian.
- Both should use clear hierarchy and concise copy, with action buttons visually distinct.

## Do's and Don'ts

- Do keep the layout airy with large margins and generous line spacing.
- Don't crowd the hero with extra text, controls, or competing visual elements.
- Do use the primary blue for the most important actions and signals.
- Don't introduce additional saturated brand colors that overpower the blue-led system.
- Do keep shadows subtle or omit them entirely in favor of borders and whitespace.
- Don't use heavy elevation or dramatic glows.
- Do maintain Geist with the same tight headline tracking and clean label styling.
- Don't switch to decorative serif fonts or all-caps UI labels.
- Do prefer rounded corners and soft pills for controls and badges.
- Don't make buttons or cards angular or overly squared off.
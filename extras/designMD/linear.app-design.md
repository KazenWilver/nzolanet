---
version: alpha
name: Linear Dark
description: A sharp, high-contrast product system with restrained motion, soft depth, and an understated premium feel.
colors:
  primary: "#f7f8f8"
  secondary: "#9aa0a6"
  tertiary: "#7170ff"
  neutral: "#08090a"
  surface: "#0f1011"
  on-surface: "#f7f8f8"
  border: "#ffffff0d"
  muted-border: "#ffffff14"
  error: "#ff5a5f"
typography:
  headline-display:
    fontFamily: "Inter Variable"
    fontSize: "56px"
    fontWeight: 510
    lineHeight: "61.6px"
    letterSpacing: "-1.232px"
  headline-lg:
    fontFamily: "Inter Variable"
    fontSize: "40px"
    fontWeight: 510
    lineHeight: "44px"
    letterSpacing: "-0.88px"
  headline-md:
    fontFamily: "Inter Variable"
    fontSize: "20px"
    fontWeight: 510
    lineHeight: "26.6px"
    letterSpacing: "-0.24px"
  headline-sm:
    fontFamily: "Inter Variable"
    fontSize: "16px"
    fontWeight: 510
    lineHeight: "24px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: "Inter Variable"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "-0.165px"
  body-md:
    fontFamily: "Inter Variable"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "-0.165px"
  body-sm:
    fontFamily: "Inter Variable"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "-0.12px"
  label-lg:
    fontFamily: "Inter Variable"
    fontSize: "16px"
    fontWeight: 510
    lineHeight: "24px"
    letterSpacing: "0px"
  label-md:
    fontFamily: "Inter Variable"
    fontSize: "15px"
    fontWeight: 510
    lineHeight: "20px"
    letterSpacing: "0px"
  label-sm:
    fontFamily: "Inter Variable"
    fontSize: "13px"
    fontWeight: 510
    lineHeight: "16px"
    letterSpacing: "0px"
  caption:
    fontFamily: "Inter Variable"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0px"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 6px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 96px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "14px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "#e5e5e6"
    textColor: "{colors.neutral}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "14px 20px"
    height: "44px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "0px 24px 28px"
  input:
    backgroundColor: "#121314"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
  chip:
    backgroundColor: "#151617"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    padding: "6px 10px"
# Linear Dark

## Overview
Linear feels precise, modern, and deeply product-focused, with a premium dark-mode aesthetic that prioritizes clarity over ornament. The interface is built for teams and technical users, so density is controlled and information is compact without feeling cramped. The tone is calm and authoritative, with a subtle sense of speed and polish.

## Colors
- **Primary (#f7f8f8):** A near-white used for main text, the prominent CTA button, and key UI highlights. It provides strong readability against the dark canvas.
- **Secondary (#9aa0a6):** A cool muted gray for supportive text, metadata, icons, and less prominent navigation items. It keeps the hierarchy quiet and restrained.
- **Tertiary (#7170ff):** A soft electric indigo accent used sparingly for emphasis and branded energy. It works well for signals, active states, and editorial highlights.
- **Neutral (#08090a):** The page background, almost-black with a slightly cool cast. It creates the signature Linear dark environment and maximizes contrast.
- **Surface (#0f1011):** Slightly lifted panel color for cards, menus, and nested regions. It separates layers without breaking the dark continuity.
- **On-surface (#f7f8f8):** The default foreground color on elevated surfaces. It ensures legible text and icons on cards and controls.
- **Border (#ffffff0d):** A very subtle white-tinted border used to define containers and shells. It adds structure while staying nearly invisible.
- **Muted-border (#ffffff14):** A slightly stronger divider tone for internal rules and separations. Useful when a hierarchy needs a touch more definition.
- **Error (#ff5a5f):** A vivid alert color for destructive states, warnings, or failed validations. It should remain rare and highly purposeful.

## Typography
Inter Variable is the sole typographic voice, reinforcing the product’s modern, system-oriented feel. Headline weights use a slightly assertive 510 weight, which reads clean and engineered rather than decorative. Headlines are tightly tracked with negative letter-spacing to create the compact, confident look seen in the hero and product UI. Body text stays at 400 weight for readability, with 15–16px sizes and comfortable 24px line height. Labels and controls reuse the same family but shift to 510 weight so buttons and navigation feel crisp. Uppercase styling is not a dominant pattern; the system relies more on size, weight, and spacing than on caps.

## Layout & Spacing
The layout follows a wide, centered hero composition with generous breathing room above the fold and a strong left-aligned content block. Content appears constrained within a broad max-width rather than a narrow editorial column, allowing the product screenshot to sit as a large showcase element. Spacing is disciplined and modular, driven by a small rhythm of 6px, 16px, 24px, 32px, and 96px. Sections use substantial vertical spacing, while cards and tool panes use tighter internal padding to maintain density. Navigation spacing is compact and even, reflecting a utility-first product UI rather than a marketing-heavy layout.

## Elevation & Depth
Depth is intentionally subtle. The system uses tonal contrast, thin borders, and surface shifts instead of dramatic shadows, which keeps the interface feeling fast and modern. Most containers sit on #0f1011 with faint borders, while the page itself remains #08090a for maximum separation. Shadows are minimal to none, so hierarchy comes from contrast, layering, and content structure rather than heavy elevation. Inner glows and very soft outlines can be used for focused states or nested shells when needed.

## Shapes
The shape language is restrained and slightly rounded. Large interactive controls use full pill radii, while cards and panels use a small 8px radius for a technical, architectural feel. This creates a clear separation between action surfaces and data surfaces. Overall, the system avoids playful curvature and stays close to a precise, software-forward geometry.

## Components
Buttons should feel compact, confident, and tactile. Use `button-primary` for the main CTA: light background, dark text, pill radius, 14px vertical padding, and a 44px minimum height. `button-secondary` is the inverse option for dark contexts, staying transparent with light text and a subtle outline feel. `button-link` is reserved for inline actions like nav links or text-only prompts and should remain undecorated except for its link treatment. Hover states should nudge contrast rather than change shape; `button-primary-hover` may darken slightly to signal interactivity.

Cards use the `card` style: dark surface, 1px faint border, 8px radius, and no noticeable shadow. They should contain dense product information, nested comments, or data summaries without adding visual clutter. Inputs should use a similarly quiet dark field treatment, with clear text contrast and modest padding. Chips and small tags should be compact pills with muted text and low-contrast fills so they support hierarchy without competing for attention. Lists, menus, and sidebars should lean on icon-led row spacing, subtle dividers, and selected-state highlights rather than boxed treatments. Tooltips and popovers should inherit the dark surface language and feel like lightweight overlays, not separate bright surfaces.

## Do's and Don'ts
- Do keep hierarchy driven by contrast, weight, and spacing before shadows or decoration.
- Do use Inter Variable consistently across hero text, UI labels, and metadata.
- Do favor pill-shaped primary actions and small-radius cards for the core shape language.
- Do keep borders extremely subtle so surfaces feel integrated into the dark canvas.
- Don't introduce bright backgrounds or colorful panels that break the restrained dark palette.
- Don't use oversized shadows, hard glows, or heavy glass effects.
- Don't switch to a decorative or condensed display font for marketing headlines.
- Don't make components feel roomy or whimsical; maintain the compact, product-first density.
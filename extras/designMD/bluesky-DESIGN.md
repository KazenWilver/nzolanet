---
version: alpha
name: "Bluesky Sky-Blue Social"
description: "Typography baseline relies on InterVariable for hero/modal headline — 'real people. real conversations.'."
colors:
  engagement-pink: "#ec4899"
  light-surface: "#eff2f6"
  page-background: "#f9fafb"
  surface-white: "#ffffff"
  brand-blue: "#006aff"
  text-muted: "#8798b0"
  text-primary: "#000000"
  text-secondary: "#405168"
  text-tertiary: "#667b99"
  border-subtle: "#dce2ea"
typography:
  display-heading:
    fontFamily: "InterVariable"
    fontSize: "30px"
    fontWeight: "600"
    lineHeight: "36px"
    letterSpacing: "-0.5px"
  section-heading:
    fontFamily: "InterVariable"
    fontSize: "20.6px"
    fontWeight: "600"
    lineHeight: "27px"
    letterSpacing: "-0.5px"
  body-default:
    fontFamily: "InterVariable"
    fontSize: "16px"
    fontWeight: "400"
  body-regular:
    fontFamily: "InterVariable"
    fontSize: "15px"
    fontWeight: "400"
    lineHeight: "20px"
  body-semibold:
    fontFamily: "InterVariable"
    fontSize: "15px"
    fontWeight: "600"
    lineHeight: "20px"
  body-medium:
    fontFamily: "InterVariable"
    fontSize: "15px"
    fontWeight: "500"
    lineHeight: "20px"
  caption:
    fontFamily: "InterVariable"
    fontSize: "13.1px"
    fontWeight: "400"
    lineHeight: "17px"
  small-label:
    fontFamily: "InterVariable"
    fontSize: "11.3px"
    fontWeight: "400"
    lineHeight: "15px"
  micro-badge:
    fontFamily: "InterVariable"
    fontSize: "8px"
    fontWeight: "700"
    lineHeight: "10px"
rounded:
  radius-pill: "999px"
  radius-card: "12px"
  radius-button: "21px"
  radius-chip: "9px"
  radius-small: "4px"
spacing:
  spacing-1: "2px"
  spacing-2: "3px"
  spacing-3: "4px"
  spacing-4: "5px"
  spacing-5: "6px"
  spacing-6: "8px"
  spacing-7: "10px"
  spacing-8: "11px"
  spacing-9: "12px"
  spacing-10: "13px"
  spacing-11: "14px"
  spacing-12: "15px"
  spacing-13: "16px"
  spacing-14: "20px"
  spacing-15: "24px"
  spacing-16: "28px"
---

## Overview

Typography baseline relies on InterVariable for hero/modal headline — 'real people. real conversations.'.

This system uses a 4px base grid with scale values 2, 3, 4, 5, 6, 8, 10, 12, 14, 15, 16, 20, 24, 28, 32.

**Signature traits:**
- Core token rhythm: Token evidence indicates consistent color, spacing, and radius rhythm across visible UI.

## Colors

The palette uses 10 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **action-text** maps to `brand-blue`: Role "text" is grounded by usage context "Primary CTA button fill, links, brand logo, 'Sign in' and 'Explore the app' link text".
- **surface-background** maps to `surface-white`: Role "background" is grounded by usage context "Modal card background, nav background, card surfaces".
- **border-border** maps to `border-subtle`: Role "border" is grounded by usage context "Nav top border, card dividers, input outlines".
- **content-text** maps to `text-primary`: Role "text" is grounded by usage context "Primary body text, headings, icon fills".

### Text Scale
- **Brand Blue** (#006aff): Primary CTA button fill, links, brand logo, 'Sign in' and 'Explore the app' link text. Role: text. {authored: rgb(0, 106, 255), space: rgb}
- **Text Muted** (#8798b0): Disabled states, very muted captions. Role: text. {authored: rgb(135, 152, 176), space: rgb}
- **Text Primary** (#000000): Primary body text, headings, icon fills. Role: text. {authored: rgb(0, 0, 0), space: rgb, alpha: 0.2}
- **Text Secondary** (#405168): Secondary headings, supporting text, muted labels. Role: text. {authored: rgb(64, 81, 104), space: rgb}
- **Text Tertiary** (#667b99): Metadata, timestamps, placeholder text, muted UI labels. Role: text. {authored: rgb(102, 123, 153), space: rgb}

### Interactive
- **Border Subtle** (#dce2ea): Nav top border, card dividers, input outlines. Role: border. {authored: rgb(220, 226, 234), space: rgb}

### Surface & Shadows
- **Engagement Pink** (#ec4899): Like/heart interaction indicators, engagement accent. Role: background. {authored: rgb(236, 72, 153), space: rgb}
- **Light Surface** (#eff2f6): Secondary surface fills, hover states, subtle section backgrounds. Role: background. {authored: rgb(239, 242, 246), space: rgb}
- **Page Background** (#f9fafb): Page-level background behind modal overlay. Role: background. {authored: rgb(249, 250, 251), space: rgb}
- **Surface White** (#ffffff): Modal card background, nav background, card surfaces. Role: background. {authored: rgb(255, 255, 255), space: rgb}

## Typography

Typography uses InterVariable across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Uses InterVariable throughout for a uniform feel. Weight range spans semi-bold, regular, medium, bold. Sizes range from 8px to 30px.

### Font Roles
- **Headline Font**: InterVariable
- **Body Font**: InterVariable

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Hero/modal headline — 'Real people. Real conversations.' | InterVariable | 30px | 600 | 36px | -0.5px | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |
| Sub-section headings and card titles | InterVariable | 20.6px | 600 | 27px | -0.5px | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |
| Default body text, nav items, button labels | InterVariable | 16px | 400 | normal | normal | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |
| Post body text, feed content, descriptions | InterVariable | 15px | 400 | 20px | normal | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |
| Display names, emphasized labels, CTA text | InterVariable | 15px | 600 | 20px | normal | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |
| Medium-emphasis labels, secondary CTAs | InterVariable | 15px | 500 | 20px | normal | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |
| Timestamps, metadata, secondary captions | InterVariable | 13.1px | 400 | 17px | normal | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |
| Badges, small tags, fine-print labels | InterVariable | 11.3px | 400 | 15px | normal | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |
| Notification count badges, pill counters | InterVariable | 8px | 700 | 10px | normal | InterVariable, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Liberation Sans, Helvetica, Arial, sans-serif | Extracted token |

## Layout

Responsive system uses 2 breakpoint tier(s): mobile, desktop.

### Responsive Strategy
- **mobile (<= 600px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **desktop (Unknown)**: Expand layout density and horizontal composition for wide viewports.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| spacing-1 | 2px | 2 | Extracted spacing token |
| spacing-2 | 3px | 3 | Extracted spacing token |
| spacing-3 | 4px | 4 | Extracted spacing token |
| spacing-4 | 5px | 5 | Extracted spacing token |
| spacing-5 | 6px | 6 | Extracted spacing token |
| spacing-6 | 8px | 8 | Extracted spacing token |
| spacing-7 | 10px | 10 | Extracted spacing token |
| spacing-8 | 11px | 11 | Extracted spacing token |
| spacing-9 | 12px | 12 | Extracted spacing token |
| spacing-10 | 13px | 13 | Extracted spacing token |
| spacing-11 | 14px | 14 | Extracted spacing token |
| spacing-12 | 15px | 15 | Extracted spacing token |
| spacing-13 | 16px | 16 | Extracted spacing token |
| spacing-14 | 20px | 20 | Extracted spacing token |
| spacing-15 | 24px | 24 | Extracted spacing token |
| spacing-16 | 28px | 28 | Extracted spacing token |
| spacing-17 | 32px | 32 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| n/a | 0 | No validated shadow payload |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | backdrop-filter | blur(15px) |
| Light | outline-color | rgb(0, 0, 0) ; rgb(102, 123, 153) ; rgb(64, 81, 104) |
| Light | outline-width | 3px ; 1px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, -105, 0) ; matrix(1, 0, 0, 1, 0, 0) ; matrix(1, 0, 0, 1, -34, 0) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| radius-small | 4px | 4 | Subtle corner |
| radius-chip | 9px | 9 | Control corner |
| radius-card | 12px | 12 | Control corner |
| radius-button | 21px | 21 | Large surface corner |
| radius-pill | 999px | 999 | Large surface corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| radius-pill | 999px | px |
| radius-card | 12px | px |
| radius-button | 21px | px |
| radius-chip | 9px | px |
| radius-small | 4px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Core token rhythm without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 600px | (max-width: 600px) |
| Breakpoint 2 | Unknown | (hover: none) and (pointer: coarse) |

## Agent Prompt Guide

### Example Component Prompts
- Create button component using validated primary color role and spacing tokens.
- Create card component with mapped radius role and evidence-backed elevation.
- Create form input component using inferred typography hierarchy and border roles.

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.

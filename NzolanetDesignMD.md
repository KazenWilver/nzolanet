# NzolaNet Fused Design System: "Carbon Aurora & Glassmorphic Twilight"

This design system fuses the best visual features from the reference designs in `extras/designMD` into a cohesive, high-fidelity dark-mode interface for a modern social network called **NzolaNet**. It actively moves away from basic AI-generated layout templates by combining high-density developer layout spacing (Vercel/Linear), minimal power-user aesthetics (Raycast), and engaging interactive elements (Bluesky).

---

## 1. Visual Identity & Brand Philosophy

NzolaNet is a developer-focused, power-user social network. The UI/UX is built to feel:
- **Fast and Focused**: Minimal ornamentation, high density, and clean lines.
- **Premium**: Soft metallic sheen, dark background layering, and glassmorphic blurs.
- **Engaging**: Saturated primary colors and micro-animations for interactive elements.

---

## 2. Core Tokens

### 2.1 Colors
The color scheme is dark-first, utilizing a near-black base with vibrant accent highlights.

| Token Name | Hex Code | Source Inspiration | Role & Usage |
| :--- | :--- | :--- | :--- |
| `canvas-background` | `#07080A` | Raycast / Linear | The deep near-black base background of the page. |
| `surface-card` | `#0F1011` | Linear | A slightly lighter dark surface for post cards and containers. |
| `surface-nav` | `rgba(11, 12, 14, 0.75)` | Raycast / Bluesky | Navbars and sidebars. Semi-transparent for glassmorphic blurs. |
| `border-subtle` | `rgba(255, 255, 255, 0.06)` | Linear / Vercel | Hairline card borders, list dividers, and subtle outlines. |
| `border-strong` | `#2F3031` | Raycast | Stronger borders for inputs, buttons, and active tabs. |
| `brand-accent` | `#7170FF` | Linear / Stripe | Radiant purple/indigo for primary CTAs, active links, and brand branding. |
| `brand-accent-hover`| `#8C8AFF` | Linear / Stripe | Hover state for primary buttons and links. |
| `engagement-pink` | `#EC4899` | Bluesky | Like ("Baze") action, notification count badges, and heart indicators. |
| `text-primary` | `#FFFFFF` | Raycast / Linear | Pure white for headings, primary labels, and emphasized text. |
| `text-secondary` | `#9C9C9D` | Raycast / Stripe | Muted cool gray for main body text, usernames, and normal copy. |
| `text-tertiary` | `#50617A` | Stripe / Vercel | Very muted gray for metadata, timestamps, and placeholders. |
| `glow-aurora` | `rgba(113, 112, 255, 0.15)`| Linear / Raycast | Soft purple glow underneath active elements, modals, or hover states. |

### 2.2 Typography
We use **Inter** (or `InterVariable`) exclusively across the interface for a sharp, tech-blog feel.

| Role | Font Size | Weight | Line Height | Letter Spacing | Styling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Heading** | `32px` | `600` (SemiBold)| `38px` | `-0.03em` | Tight tracking, high impact |
| **Section Title** | `20px` | `600` (SemiBold)| `26px` | `-0.02em` | For card titles, page headers |
| **Body Default** | `15px` | `400` (Regular) | `22px` | `-0.01em` | Standard text, feed post text |
| **Label / Button** | `14px` | `500` (Medium)  | `20px` | `0` | Interface controls, buttons |
| **Caption / Meta** | `12px` | `400` (Regular) | `16px` | `0` | Timestamps, follow count labels |

### 2.3 Shapes & Spacing
- **Corner Radii**:
  - `radius-sm`: `4px` (Inputs, tags)
  - `radius-md`: `8px` (Buttons, small cards)
  - `radius-lg`: `12px` (Post cards, dropdowns)
  - `radius-pill`: `9999px` (User avatars, baze counts, tags)
- **Spacing Grid**: Built on a strict `4px` grid scale: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`.

---

## 3. Structural Layout (Three-Column System)

NzolaNet uses a centered layout with fixed maximum width (`1200px`) and three distinct columns:
1. **Left Sidebar (`240px`)**: Compact, text-and-icon-only navigation menu inspired by Vercel and Raycast. Icons are minimal outline SVGs.
2. **Main Feed (`640px`)**: Central column where posts, comment section, edit forms, and user profile information reside. Separated from sidebars by hairline dividers.
3. **Right Sidebar (`280px`)**: Displays recommended accounts to follow ("Quem Seguir") and active pending follow requests (for private accounts) to approve/reject.

---

## 4. Components & Interactive States

### 4.1 Post Card
- **Surface**: Background `#0F1011` with a `1px` border of `rgba(255, 255, 255, 0.06)`.
- **Header**: Circular avatar (`radius-pill`), display name in `text-primary`, username `@handle` in `text-secondary`, and timestamp in `text-tertiary`.
- **Content**: Plain text (`body-default` in `text-secondary`). Images and videos are embedded with a container radius of `8px` and subtle shadows.
- **Footer Actions**:
  - **Baze Button**: Toggles to `#EC4899` (engagement-pink) with a tiny pulse animation on click.
  - **Comment Button**: Outline comment bubble SVG, toggles to `#7170FF` (brand-accent) on hover, showing the total comment count.

### 4.2 Interactive Inputs & Buttons
- **Primary Button**: Background `#7170FF` (brand-accent), text `#FFFFFF` (text-primary), radius `radius-md`. On hover, transitions smoothly to `#8C8AFF`.
- **Secondary Button**: Background `transparent`, border `1px solid rgba(255, 255, 255, 0.1)`, text `#FFFFFF`.
- **Text Inputs**: Background `#07080A` (canvas-background), border `1px solid #2F3031`, text `#FFFFFF`, focus outline in `#7170FF` with a soft `3px` glow ring.

### 4.3 Navbars & Modals
- **Glassmorphism**: Top header navbar uses `backdrop-filter: blur(16px)` with `background: rgba(7, 8, 10, 0.8)` and a bottom border `border-subtle`.
- **Modals**: Centered overlays with a slight backdrop blur and a `glow-aurora` drop shadow underneath.

---

## 5. Micro-interactions & Special Animations

1. **Baze (Like) Animation**:
   - When clicking the "Baze" button, the heart icon scales up to `1.4` and scales back down via CSS transition: `transform: scale(1.4) -> scale(1)`.
   - The counter increments smoothly with a brief fade-in/fade-out slide transition.
2. **Follow Request Actions**:
   - Rejecting/approving a request slides the request card out of view (`opacity: 0; transform: translateX(30px)`) before removing it from the DOM.
3. **Skeleton Loading**:
   - Text lines and profile image placeholders pulse with a subtle shimmer gradient from `#0F1011` to `#1F2022` to `#0F1011` every 1.5 seconds.

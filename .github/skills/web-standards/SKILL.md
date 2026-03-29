---
name: 'web-standards'
description: 'Professional web design and CSS standard created by AlexCG Design. Apply these rules ALWAYS when generating HTML, CSS, or a complete web project. This skill activates for requests to create, design, or layout a website, landing page, portfolio, dashboard, UI component, web page, or any frontend project. It also triggers when a user asks "build me a site", "create a page", "design a component", "layout this", "generate the HTML/CSS", or any variant that requires writing frontend code. This skill defines quality rules — not visual identity: colors, typography, and branding are decided creatively per project.'
---

# Web Standards

Professional web design and CSS standard by AlexCG Design. These rules ensure clean code, solid design, and optimal performance in any frontend project. Visual identity (color palette, typefaces, branding) is free and creative per project — this skill defines the *how*, not the *what*.

## 1. HTML & Semantics

HTML is the foundation. Well-structured semantic HTML improves accessibility, SEO, and makes CSS cleaner and more maintainable.

### Semantic Tags

Always use HTML tags that describe the content's meaning:

- `<header>` for page or section headers.
- `<nav>` for primary and secondary navigation.
- `<main>` as the single container for main content.
- `<section>` to group thematically related content.
- `<article>` for self-contained, independent content.
- `<aside>` for complementary content.
- `<footer>` for page or section footers.
- `<figure>` and `<figcaption>` for images with context.

Avoid generic `<div>`s when a semantic alternative exists. Each `<section>` must have a heading (`h2`–`h6`) that identifies it.

### Accessibility (a11y)

Accessibility is not optional — it's part of the quality standard:

- Minimum WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text.
- Define `:focus-visible` for all interactive elements.
- Do not rely on color alone to communicate state (add icons, text, or patterns).
- Respect `prefers-reduced-motion` by wrapping animations in `@media (prefers-reduced-motion: no-preference)`.
- Decorative images: `alt=""`; informative images: descriptive `alt` text.
- Forms: associate every `<label>` with its `<input>`.
- Use `aria-label` or `aria-labelledby` only when no visual label exists.

### Responsive Images & Media

- Use `aspect-ratio` on image containers to reserve space and avoid layout shifts.
- Use `object-fit: cover` or `contain` as appropriate — never distort images.
- Add `loading="lazy"` for below-the-fold images by default.
- Prefer modern formats (WebP, AVIF) with fallbacks when needed.
- Use `<picture>` with `<source>` to serve different resolutions or formats.

## 2. CSS Architecture

Architecture dictates how CSS is organized, named, and scaled. Well-architected CSS reads like a document, not a random collection of rules.

### BEM Methodology

Use Block__Element--Modifier naming:

```css
/* Block */
.card { }

/* Element (part of the block) */
.card__title { }
.card__image { }
.card__body { }

/* Modifier (variant) */
.card--featured { }
.card--dark { }
```

Each block is an independent component. Elements belong to their block. Modifiers alter appearance or behavior without introducing a new core class.

### Keep Specificity Low

Low specificity keeps CSS predictable and maintainable:

- Do not use IDs as CSS selectors (reserve them for JavaScript and anchors).
- Avoid nesting deeper than 2 levels (`.block .block__element` max).
- Never use `!important` except for deliberate utility overrides.
- Prefer single, descriptive classes over complex chained selectors.
- Stylesheet order: reset → base → layout → components → utilities.

### Custom Properties

CSS variables are the design system's nervous system. Define system tokens in `:root`:

```css
:root {
  /* Colors — override in dark mode */
  --color-primary: ;
  --color-secondary: ;
  --color-accent: ;
  --color-bg: ;
  --color-bg-alt: ;
  --color-text: ;
  --color-text-muted: ;

  /* Spacing scale */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */

  /* Typography */
  --font-primary: ;
  --font-secondary: ;
  --font-mono: ;

  /* Border radius scale */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 200ms ease-out;
  --transition-base: 300ms ease-out;
  --transition-slow: 400ms ease-out;
}
```

All repeated visual decisions should be custom properties. Changing the theme should be possible by editing variables in `:root` only.

### Spacing System

Do not invent arbitrary spacing values. Always use the defined spacing scale to maintain rhythm and consistency:

- Inside components: `--space-sm` to `--space-md`
- Between components: `--space-lg` to `--space-xl`
- Between sections: `--space-2xl` to `--space-3xl`
- Section vertical padding: minimum `--space-2xl`

### Color by Purpose

Define the palette entirely via variables to support theming and dark mode:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: ;
    --color-bg-alt: ;
    --color-text: ;
    --color-text-muted: ;
    /* Brand colors may be kept or tweaked */
  }
}
```

Each color has a role: primary for CTAs and action, secondary for support, accent for emphasis, and background/text variants for legibility. Do not use colors outside the defined system.

## 3. Layout & Responsive

Layout is the backbone of the experience. Mobile-first is a strategy that ensures the design works in the most constrained context first and improves progressively.

### Mobile-First

Write base styles for small screens and scale up:

```css
/* Mobile base */
.grid { display: grid; grid-template-columns: 1fr; gap: var(--space-md); }

/* Tablet */
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

Breakpoints are guidelines — adapt to content, not to specific devices. Test across widths rather than just three fixed sizes.

### Flexbox vs Grid

Use each tool where it excels:

- **Flexbox** for one-dimensional layouts: navbars, button groups, aligning items within a container.
- **CSS Grid** for two-dimensional layouts: card grids, full page layouts, designs that need control over both rows and columns.

Always use `gap` instead of margins for spacing between flex/grid children. Prefer `auto-fit` and `minmax()` for intrinsically responsive grids.

### Container Queries

Components should respond to their container, not just the viewport:

```css
.card-container { container-type: inline-size; }

@container (min-width: 400px) {
  .card { flex-direction: row; }
}
```

Container queries make components truly reusable and adaptable to their placement.

### Fluid Typography

Use `clamp()` to scale type smoothly between breakpoints:

```css
:root {
  --text-sm: clamp(0.875rem, 0.8rem + 0.2vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.3vw, 1.125rem);
  --text-lg: clamp(1.25rem, 1rem + 0.5vw, 1.5rem);
  --text-xl: clamp(1.5rem, 1.2rem + 0.8vw, 2rem);
  --text-2xl: clamp(2rem, 1.5rem + 1.5vw, 3rem);
  --text-hero: clamp(2.5rem, 2rem + 2vw, 4.5rem);
}
```

Limit to 2–3 font families per project. Clear hierarchy for headings, subtitles, body, and captions. Generous line-height: 1.5–1.7 for body, 1.1–1.3 for large headings.

## 4. Animations & Performance

Animations give personality but must never sacrifice performance.

### Optimized Animations

Prefer CSS for animations when possible. Every animation should have a purpose — feedback, navigation affordance, state indication, or attention hierarchy. If an animation lacks clear intent, remove it.

### Animate only transform and opacity

These properties run on the compositor (GPU) and avoid reflow/repaint:

```css
/* Good — runs on compositor */
.element { transition: transform var(--transition-base), opacity var(--transition-base); }
.element:hover { transform: translateY(-4px); opacity: 0.9; }

/* Bad — causes reflow and is expensive */
.element:hover { width: 110%; margin-top: -10px; height: auto; }
```

Never animate `width`, `height`, `margin`, `padding`, `top`, `left`, `right`,
`bottom`, or `border-width`. Use `transform: scale()` for scaling effects.

### Microinteractions

Set durations and easing appropriate to the interaction:

- Hover/states: 200ms, `ease-out`.
- Enter/appear: 300ms, `ease-out`.
- Exit/disappear: 200ms, `ease-in`.
- Layout movements: 300–400ms, `ease-in-out`.

Avoid `linear` except for continuous animations (loaders, spinners). Never exceed 500ms for UI transitions — they feel sluggish.

### Visual performance

- Use `will-change` only on elements that will actually animate, and remove it after the animation when possible.
- Avoid animating more than 2–3 properties concurrently on the same element.
- Prefer `@keyframes` with discrete steps over long, chained transitions.
- Respect `prefers-reduced-motion` and simplify or disable animations when set.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 5. Visual Design Rules

Design is communication. These rules ensure each visual choice is intentional and professional.

### Whitespace and breathing room

Whitespace is a design element, not waste. Sections should have generous vertical padding (minimum `--space-2xl`). Elements should not compete for attention — spacing creates relationships and hierarchy.

When in doubt, choose more space. Professional design breathes; amateur design crams.

### Clear visual hierarchy

Each section should have a clear primary focus:

- One dominant element per section (large heading, hero image, primary CTA).
- The rest subordinated by size, weight, and contrast.
- Maximum 3 visual hierarchy levels per section: dominant → support → detail.
- Headings should not compete — only one should dominate per view.

### Consistent borders and radii

Define a border-radius system and stick to it. Use the variables in `:root` (`--radius-sm` to `--radius-full`). Do not mix arbitrary radii. If a project uses rounded corners, apply them consistently; if corners are sharp, keep them sharp.

### Visual grid & alignment

Everything should feel aligned to an invisible grid:

- Text aligned to the same left edge.
- Cards in a row sharing width.
- Even spacing between equivalent elements.
- Nothing floating without relation to other elements.

### Contrast & visual weight

Contrast is more than color — it's the difference between competing elements. A CTA stands out by:

- Bigger size than surrounding elements.
- Solid color in a soft color field.
- Stronger typographic weight.
- Generous space around it to isolate it visually.

Combine at least two contrast types for important elements.

### Ratios and proportions

Avoid arbitrary dimensions. Use harmonious proportions:

- Cards with consistent `aspect-ratio` (16/9, 4/3, 1/1).
- Sections with heights that respect the spacing scale.
- Images that preserve their proportions.
- Content containers with reasonable `max-width` (1200–1400px for reading).

### Complete interactive states

Every clickable element must define five states:

```css
.button { /* Default */ }
.button:hover { /* Hover feedback */ }
.button:focus-visible { /* Keyboard focus outline */ }
.button:active { /* Click/tap feedback */ }
.button:disabled { /* Visually inactive, cursor: not-allowed */ }
```

Do not omit any state. A button without `:focus-visible` fails accessibility.

### Content-first design

Layouts should serve content, not force content to fit. Do not cram long copy into small cards or stretch an image to fill a space. If content needs more room, the layout adapts.

## 6. Project Structure

A well-organized project should be understandable at a glance.

### File organization

```
project/
├── index.html
├── pages/
│   ├── about.html
│   └── contact.html
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   ├── components/
│   │   ├── header.css
│   │   ├── card.css
│   │   ├── button.css
│   │   └── footer.css
│   └── utilities.css
├── js/
│   └── main.js
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
└── README.md
```

Each CSS file should have a single responsibility. If a file exceeds ~200 lines, consider splitting it.

### File naming

- Use `kebab-case` for filenames: `hero-section.css`, `contact-form.css`.
- Descriptive names; avoid abbreviations.
- No numbers in filenames unless they denote version or variant.
- Be consistent across the project.

### CSS property order

Within a selector, follow this logical order:

```css
.component {
  /* 1. Positioning */
  position: ;
  top: ; right: ; bottom: ; left: ;
  z-index: ;

  /* 2. Box model */
  display: ;
  flex: ; grid: ;
  width: ; height: ;
  margin: ;
  padding: ;
  border: ;

  /* 3. Typography */
  font-family: ;
  font-size: ;
  font-weight: ;
  line-height: ;
  color: ;
  text-align: ;

  /* 4. Visual */
  background: ;
  border-radius: ;
  box-shadow: ;
  opacity: ;
  overflow: ;

  /* 5. Animations & transitions */
  transition: ;
  animation: ;
  transform: ;
}
```

### Comments & documentation

- Separate sections of CSS with clear block comments.
- Document custom properties in `variables.css` explaining their purpose.
- Include a `README.md` with instructions to run and modify the project.
- Comment non-obvious decisions, not self-explanatory code.

```css
/* ================================================
   HEADER — Main navigation (sticky)
   ================================================ */

/* High z-index required because the hero contains
   positioned elements */
.header {
  position: sticky;
  z-index: 100;
}
```

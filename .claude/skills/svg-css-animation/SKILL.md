---
name: 'svg-css-animation'
description: 'Generates SVG micro-animations with pure CSS (zero JavaScript, zero libraries). Activate when the user wants to animate an SVG, add animations to an illustration, create entry/reveal/pulse effects in SVG, or requests CSS animations for vector graphics. Use `@property` + `@keyframes`, handle existing transform attributes with clean wrappers, and apply `transform-box: fill-box` for SVG. Always ask the animation type before generating: simple, staged, or detailed.'
---

# SVG + CSS Micro-Animations Skill

## Philosophy

The SVG is never structurally modified. What we do is:

1. Analyze the SVG to understand which parts we want to animate and which transforms already exist.
2. Group animatable parts with `<g id="name">` if they are not identified.
3. Control those parts from pure CSS using `@property` + `@keyframes`.

No JavaScript. No libraries. Only modern CSS.

## Step 0 — Ask before generating

Before writing a single line of code, always ask the user:

> "What type of animation are you looking for?
> - **Simple**: smooth entrance of the whole illustration (fade + scale). Fast and clean.
> - **Staged**: each section appears in sequence (background → content → character). More narrative.
> - **Detailed**: element-specific animations (pulse, shake, reveal, rotation). Maximum expressiveness."

With that answer, also inspect the SVG and identify:

1. **Which groups/paths are independent actors?** (character, background, UI, icons).
2. **Do they have existing `transform` attributes?** (`transform="translate(...)"`, `transform="rotate(...)"`).
3. **Is the requested complexity compatible with the actors available in the SVG?**.

## Step 1 — Identify what to animate and plan the story

Define the "chapters" of the animation with percentages:

```text
0%   → initial state (everything hidden or in start position)
33%  → Phase 1 complete
66%  → Phase 2 complete
100% → final state (everything in place)
```

Maximum 3–4 phases per animation. More phases = unnecessary complexity.

## Step 2 — Handle existing transform attributes

This is the most common error: a `<g>` already has `transform="translate(x, y)"` as an attribute. If you apply a CSS `transform` on top of it, values collide and elements become mispositioned.

### Example of solution

#### Wrong

```html
<!-- ❌ WRONG: this <g> already has a transform attribute; CSS transform will collide -->
<g id="dashboard" transform="translate(657.698 351.964)">
  ...paths...
</g>
```

#### Correct

```html
<!-- ✅ RIGHT: clean wrapper, no transform attribute on the wrapper -->
<g id="dashboard-wrapper">
  <g transform="translate(657.698 351.964)">  <!-- original transform preserved -->
    ...paths...
  </g>
</g>
```

### When to use a wrapper vs animate directly

| Situation | What to do |
|---|---|
| The `<g>` does NOT have a `transform` attribute | Animate directly, add an `id` |
| The `<g>` DOES have a `transform` attribute | Add a wrapper `<g id="...">` with no transform |
| You only need opacity (fade) | Animate directly even if it has a transform (opacity does not collide) |

## Step 3 — Declare `@property` for each animatable variable

```css
/* For transforms (translate, rotate, scale) */
@property --name-transform {
  syntax: "<transform-function>";
  inherits: true;
  initial-value: scale(1);
}

/* For opacities */
@property --name-opacity {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

/* For clip-path with percentages */
@property --name-clip {
  syntax: "<percentage>";
  inherits: true;
  initial-value: 0%;
}

/* For angles */
@property --name-rotate {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}
```

Why it matters: without `@property`, custom properties are strings — the browser cannot interpolate them. With the declared type, transitions are smooth.

## Step 4 — Apply variables in static selectors

```css
#my-wrapper {
  transform-box: fill-box;           /* Transform relative to the element itself */
  transform-origin: center center;   /* Adjust depending on the animation */
  transform: var(--my-transform);
  opacity: var(--my-opacity);
}
```

`transform-box: fill-box` is key for SVG — without it, `transform-origin` is calculated relative to the SVG viewport, not the element.

## Step 5 — Use one `@keyframes` to tell the whole story

```css
.container {
  animation: story 2s forwards ease-out;
}

@keyframes story {
  0% {
    --transform-a: scale(0);
    --opacity-b: 0;
  }
  33% {
    --transform-a: scale(1);  /* Phase 1 complete */
    --opacity-b: 0;
  }
  66% {
    --transform-a: scale(1);
    --opacity-b: 1;           /* Phase 2 complete */
  }
  100% {
    --transform-a: scale(1);
    --opacity-b: 1;
  }
}
```

Always `forwards` — so the final state is preserved.

## Common patterns

See [common-css-svg-patterns.md](./references/common-css-svg-patterns.md) for ready-to-use snippets for common animation types: appearance, slide-in, rise-in, clip-path reveals, pulse, and stacking.

## Output structure

Always produce two files:

1. `index.html` — the SVG with necessary `id`s and wrappers, plus a container for the animation. See the [index.html template](./assets/index.html) for the structure and necessary attributes to make it work with CSS animations.
2. `styles.css` — the CSS with `@property`, static selectors, and `@keyframes` telling the story. See the [styles.css template](./assets/styles.css) for the structure and necessary properties.

## Golden rules

- Zero JavaScript.
- Do not modify the SVG — only add `id` attributes and empty wrapper `<g>` elements when necessary.
- One single `@keyframes` — the whole story in one block.
- `transform-box: fill-box` on any SVG element that uses CSS transforms.
- Always use `forwards`.
- Use a clean wrapper when a group already has a `transform` attribute.
- Use opacity-only animations when transform is not necessary (avoids conflicts without wrappers).

## Checklist before delivering

- [ ] Do all animated groups have `id`s?
- [ ] Do groups with existing `transform` attributes have a clean wrapper?
- [ ] Do all selectors that use transforms have `transform-box: fill-box`?
- [ ] Does the animation use `forwards`?
- [ ] Is there any JavaScript anywhere? (If so, remove it)
- [ ] Does the story make visual sense?

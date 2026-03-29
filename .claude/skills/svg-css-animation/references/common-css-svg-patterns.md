# Common SVG/CSS animation patterns

## Appearance (scale 0→1)

```css
@property --scale-element { syntax: "<transform-function>"; inherits: true; initial-value: scale(0); }
#el { transform-box: fill-box; transform-origin: center center; transform: var(--scale-element); }
```

## Slide in from the left

```css
@property --slide-in { syntax: "<transform-function>"; inherits: true; initial-value: translateX(-20px); }
#el { transform-box: fill-box; transform: var(--slide-in); opacity: var(--opacity-el); }
```

## Rise in from below

```css
@property --rise-in { syntax: "<transform-function>"; inherits: true; initial-value: translateY(16px); }
#el { transform-box: fill-box; transform: var(--rise-in); opacity: var(--opacity-el); }
```

## Reveal with clip-path (left → right, ideal for charts)

```css
@property --clip-reveal { syntax: "<percentage>"; inherits: true; initial-value: 100%; }
#el { clip-path: inset(0 var(--clip-reveal) 0 0); }
/* keyframes: 0% → 100%, 100% → 0% */
```

## Circular reveal (radial clip-path)

```css
@property --clip-circle { syntax: "<percentage>"; inherits: true; initial-value: 0%; }
#el { clip-path: circle(var(--clip-circle) at 50% 50%); }
```

## Pulse (heartbeat)

```css
@property --pulse { syntax: "<transform-function>"; inherits: true; initial-value: scale(1); }
/* keyframes: 0% scale(1) → 10% scale(1.3) → 22% scale(0.95) → 32% scale(1.2) → 44% scale(0.95) → 55% scale(1) */
```

## Stacking trick (two elements in the same space)

```css
.container { display: grid; place-items: center; grid-template-areas: "slot"; }
.element-a, .element-b { grid-area: slot; }
```

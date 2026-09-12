# Accessibility and browser verification

Maintain these contracts in both German and English and in light, dark and
system themes:

- One labelled main heading per view, a visible-on-focus skip link, semantic
  navigation, native controls, associated labels and error/help descriptions.
- Keyboard access to every operation. Output tabs use arrow/Home/End keys;
  dialogs constrain focus, support Escape and restore focus to their trigger.
- Route/step changes focus the new context; validation focuses the relevant
  field. Status and error messages use appropriate live regions.
- Visible token-based focus rings, sufficient contrast, and focus visibility
  under forced colors. Decorative SVGs are hidden; actions retain text names.
- Reflow at 360 px, tablet and desktop widths without page-level horizontal
  overflow. Long names, technical values and prompt text wrap within panels.
- `prefers-reduced-motion` removes transitions and hover motion, limits
  animations and avoids smooth scrolling. Do not encode state only by color.
- Language changes update document `lang`, titles, accessible names and dates.

React Testing Library covers forms, dialogs, focus, theme behavior and locale
changes. Playwright covers all five routes, keyboard navigation, responsive
reflow and reduced motion in Chromium and Firefox. Run:

```bash
npm run verify
npm run test:browser:install
npm run test:browser
```

For visual review, inspect populated and empty states at 1440×1000,
768×1024 and 360×800 in both themes/languages, with long names and error states.
Check 200% zoom and OS high-contrast behavior where available. Automated DOM
and browser checks are not certification for every screen reader, touch
device or operating system. Report the exact environment when filing an issue.

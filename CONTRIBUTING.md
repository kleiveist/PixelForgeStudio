# Contributing

Contributions to PixelForge Prompt Studio are welcome: reproducible bugs,
translations, documentation, accessibility improvements and focused patches.
Please read the [code of conduct](CODE_OF_CONDUCT.md) and
[community/governance guide](COMMUNITY.md). English is preferred for public
issues and commits; German reports are also welcome.

## Start with a focused issue

Search existing issues before opening one. For a substantial feature, agree
on scope and data compatibility before implementation. Do not include real
workspace exports, access tokens, private hostnames or personal screenshots.
Use invented minimal examples. Report vulnerabilities [privately](SECURITY.md).

## Clean local setup

Use Node.js 22 (22.12+) and npm 10. Fork the repository and clone your fork,
or clone this repository for read-only testing:

```bash
git clone https://github.com/kleiveist/PixelForgeStudio.git
cd PixelForgeStudio
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. Install dev dependencies; do not install Vite
globally as a workaround for an incomplete `npm ci`.

```bash
npm run verify
npm run test:browser:install
npm run test:browser
git diff --check
```

On a Linux test host, `npx playwright install --with-deps chromium firefox`
also installs required browser libraries (system package installation may
require administrator rights). Do not weaken browser sandbox settings on
your normal workstation. CI provides its own clean browser environment.
For deployment changes, also run `bash scripts/smoke-compose.sh` and
`bash scripts/smoke-proxy.sh` on a Docker test host.

## Design boundaries

- Follow [architecture](src/ARCHITECTURE.md), [stack](docs/TECHNOLOGIE-STACK-V2.md),
  [category rules](docs/V2-ABFRAGEKATALOG-UND-PROFILMODELL.md) and
  [prompt specification](docs/PROMPT-SPECIFICATION.md).
- Keep domain logic pure TypeScript. Use React Hook Form for forms, Zod for
  unknown data and existing adapters for persistence.
- Preserve [schema-V2 IDs, storage and migration](docs/COMPATIBILITY.md).
  No schema bump, silent default change or destructive migration without an
  explicit reviewed design. Product version and data version are separate.
- Add typed translations for both UI languages. Never translate persisted
  enum IDs or overwrite custom user text; see [localization](docs/LOCALIZATION.md).
- Add behavior tests with React Testing Library, domain tests with Vitest,
  and browser smokes for critical user journeys. Test error/empty states and
  [keyboard/reflow behavior](docs/ACCESSIBILITY.md), not only screenshots.
- Commit `package-lock.json` when dependencies change. Keep generated `dist/`,
  caches, credentials and real user data out of Git. Review dependency licenses.

## Pull requests and commits

Use one focused issue per change, explain why it is needed, include test
results and sanitized screenshots for UI changes, and document migration or
deployment risks. Update the relevant docs and changelog. Maintainers review
scope, compatibility, security, accessibility and CI before merging. Avoid
unrelated formatting changes. Do not bypass a failed check to obtain a release.

Commit format: `<emoji> <English Conventional Commit>`, for example:

```text
🌐 feat(i18n): translate the profile deletion dialog
🐛 fix(storage): preserve drafts when local writes fail
📖 docs: clarify workspace backup behavior
```

Only claim `Closes #123` when the acceptance criteria are actually met.
By contributing, you confirm that you may submit the work under the existing
[MIT license](LICENSE); retain required third-party notices. No separate CLA
or guaranteed review/response time is offered.

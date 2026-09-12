## Change and related issue

Explain the user-visible outcome and link the issue. Do not claim an issue is
closed until its acceptance criteria are met.

## Verification

- [ ] `npm run verify` and `git diff --check` pass.
- [ ] Relevant Chromium/Firefox smokes pass (or explain why unaffected).
- [ ] Behavior/domain regression tests cover the change and failure paths.
- [ ] Both languages, keyboard access and narrow layouts were considered.
- [ ] V2 schema/IDs/storage/migration contracts remain compatible.
- [ ] Documentation/changelog and dependency notices are updated as applicable.
- [ ] No credentials, private hostnames or real user data are included.

## Risks and evidence

Describe data/deployment implications and include only sanitized screenshots
or logs. Send vulnerability details through SECURITY.md, not this public PR.

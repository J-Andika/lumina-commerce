## What

<!-- One paragraph: what changed and why. -->

Closes #

## How to test

<!-- Exact steps a reviewer can follow. -->

1.

## Screenshots / recording

<!-- UI changes require a before/after or a short clip. -->

## Checklist

- [ ] Acceptance criteria in the linked issue are met
- [ ] `npm run lint && npm run typecheck && npm run test` pass locally
- [ ] New logic has unit tests; new flow has an E2E test (once e2e exists)
- [ ] Keyboard-accessible and no new axe violations
- [ ] No secrets, no `.env` files, no committed database files
- [ ] Demo redeployed to the sandbox and `/api/health` checked (if user-facing)

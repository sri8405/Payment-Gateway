# GitHub Repository Settings

## Branch Protection: main

Enable branch protection for `main`:

- Require a pull request before merging.
- Require approvals before merge.
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Required status check: `Lint and Build`.
- Require conversation resolution before merging.
- Block force pushes.
- Block deletions.
- Restrict who can push directly.

## Branch Protection: develop

Enable branch protection for `develop`:

- Pull requests preferred.
- Require status checks when practical.
- Block force pushes.
- Block deletions.
- Allow maintainers to merge after CI passes.

## Labels

Create these labels:

| Label | Suggested Color | Purpose |
| --- | --- | --- |
| feature | `0E8A16` | New product capability |
| bug | `D73A4A` | Reproducible defect |
| enhancement | `A2EEEF` | Improvement to existing behavior |
| documentation | `0075CA` | Documentation-only change |
| security | `B60205` | Security-sensitive work |
| performance | `FBCA04` | Speed, build, or runtime improvement |
| ui | `C5DEF5` | User interface work |
| backend | `5319E7` | Server, API, auth, or business logic |
| database | `006B75` | MongoDB, schema, or persistence work |
| high-priority | `B60205` | Urgent or release-blocking |
| low-priority | `D4C5F9` | Nice-to-have |

## Repository Secrets

Configure these secrets before production deployment:

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- Deployment provider tokens, if used


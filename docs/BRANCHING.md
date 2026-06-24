# Branching Strategy

Payment-Gateway uses a production-oriented Git flow:

```text
feature/*
  -> develop
  -> release/*
  -> main
```

## Permanent Branches

### main

`main` contains production-ready code only. Every commit on `main` should be deployable and tagged when released.

Rules:

- No direct pushes.
- Pull requests required.
- CI status checks required.
- Branch must be up to date before merge.
- Use squash or merge commits consistently.

### develop

`develop` is the integration branch for completed feature work. It should stay stable enough for QA and staging deployments.

Rules:

- Pull requests preferred.
- No force pushes.
- CI should pass before merge.
- Feature branches merge into `develop`.

## Feature Branches

Create feature branches from `develop`:

- `feature/mongodb`
- `feature/auth`
- `feature/donation-form`
- `feature/payment-flow`
- `feature/upi-integration`
- `feature/admin-dashboard`
- `feature/settings`
- `feature/seva-management`
- `feature/receipt-generator`
- `feature/mobile-responsive-ui`

Use feature branches for focused units of work. Delete a feature branch after it is merged to `develop`.

## Release Branches

Create release branches from `develop` when preparing production releases:

- `release/v1.0`
- `release/v1.1`
- `release/v2.0`

Only release stabilization work should go into release branches:

- Bug fixes
- Version updates
- Documentation updates
- Release notes

Merge release branches into `main`, tag the release, then merge `main` back into `develop`.

## Hotfix Branches

Create `hotfix/*` branches from `main` for urgent production fixes.

Flow:

```text
main
  -> hotfix/short-description
  -> main
  -> develop
```

Delete the hotfix branch after it is merged.


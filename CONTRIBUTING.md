# Contributing

Thank you for contributing to Payment-Gateway. This repository is maintained as a production-grade application, so changes should be small, reviewed, documented, and verified by CI.

## Branch Naming

Create branches from `develop` unless you are fixing production.

Use:

```text
feature/short-description
fix/short-description
refactor/short-description
docs/short-description
hotfix/short-description
release/vX.Y
```

Planned feature branches:

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

## Commit Conventions

Use Conventional Commits:

```text
feat: add donation form
fix: resolve mongodb connection issue
refactor: simplify payment service
docs: update installation guide
test: add donation validation tests
chore: update dependencies
style: adjust responsive spacing
```

Allowed prefixes:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `test:`
- `chore:`
- `style:`

## Pull Request Process

1. Create a branch from `develop`.
2. Keep the branch focused on one concern.
3. Run local checks:

```bash
npm run lint
npm run build
```

4. Open a pull request into `develop`.
5. Fill out the PR template.
6. Wait for CI to pass.
7. Request review.
8. Address feedback with additional commits.
9. Squash or merge according to the repository policy.
10. Delete the branch after merge.

## Review Process

Reviewers should check:

- Correctness
- Security impact
- Data model changes
- Environment variable changes
- Mobile responsiveness
- Accessibility
- Error handling
- Test or verification coverage
- Documentation updates

## Release Process

Release branches are created from `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.0
```

After QA, merge into `main`, tag the release, and sync `main` back into `develop`.


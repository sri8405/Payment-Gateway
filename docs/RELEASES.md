# Release Management

Payment-Gateway follows semantic versioning.

## Version Types

- `v1.0.0`: First stable production release.
- `v1.1.0`: Backward-compatible feature release.
- `v2.0.0`: Major release with breaking changes.

## Release Flow

1. Create `release/vX.Y` from `develop`.
2. Stabilize the release branch.
3. Open a pull request from `release/vX.Y` to `main`.
4. Merge after CI and approval.
5. Tag the merge commit on `main`.
6. Publish GitHub release notes.
7. Merge `main` back into `develop`.

## Tagging

Use annotated tags:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Hotfix Releases

For urgent production fixes:

```text
main -> hotfix/fix-name -> main -> develop
```

Patch versions should increment:

- `v1.0.0`
- `v1.0.1`
- `v1.0.2`


# Current Project Migration Commands

Run these commands from the project root.

## 1. Initialize Git

```bash
git init
git branch -M main
```

## 2. Connect GitHub Repository

```bash
git remote add origin https://github.com/sri8405/Payment-Gateway.git
git remote -v
```

If the remote already exists:

```bash
git remote set-url origin https://github.com/sri8405/Payment-Gateway.git
```

## 3. First Commit

```bash
git add .
git commit -m "chore: initialize production repository structure"
```

## 4. Push main

```bash
git push -u origin main
```

## 5. Create develop

```bash
git checkout -b develop
git push -u origin develop
```

## 6. Create Feature Branches

Create these branches from `develop`:

```bash
git checkout develop

git checkout -b feature/mongodb
git push -u origin feature/mongodb

git checkout develop
git checkout -b feature/auth
git push -u origin feature/auth

git checkout develop
git checkout -b feature/donation-form
git push -u origin feature/donation-form

git checkout develop
git checkout -b feature/payment-flow
git push -u origin feature/payment-flow

git checkout develop
git checkout -b feature/upi-integration
git push -u origin feature/upi-integration

git checkout develop
git checkout -b feature/admin-dashboard
git push -u origin feature/admin-dashboard

git checkout develop
git checkout -b feature/settings
git push -u origin feature/settings

git checkout develop
git checkout -b feature/seva-management
git push -u origin feature/seva-management

git checkout develop
git checkout -b feature/receipt-generator
git push -u origin feature/receipt-generator

git checkout develop
git checkout -b feature/mobile-responsive-ui
git push -u origin feature/mobile-responsive-ui
```

In daily work, create feature branches only when implementation begins. Long-lived empty feature branches are optional but not required.

## 7. Create First Release Branch

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.0
git push -u origin release/v1.0
```

## 8. Merge Release Into main

```bash
git checkout main
git pull origin main
git merge --no-ff release/v1.0 -m "chore: release v1.0.0"
git push origin main
```

## 9. Tag First Release

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 10. Sync main Back Into develop

```bash
git checkout develop
git pull origin develop
git merge --no-ff main -m "chore: sync main after v1.0.0 release"
git push origin develop
```


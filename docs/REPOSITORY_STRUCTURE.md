# Repository Structure

Target production repository layout:

```text
Payment-Gateway/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   ├── CODEOWNERS
│   └── PULL_REQUEST_TEMPLATE.md
├── app/
├── components/
├── docs/
├── lib/
├── public/
├── scripts/
├── types/
├── .env.local.example
├── .gitignore
├── CONTRIBUTING.md
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Future `src/` Migration

For a future architecture PR, the app can move to:

```text
src/
├── app/
├── components/
├── lib/
└── types/
```

When that migration happens, update `tsconfig.json` aliases from:

```json
"@/*": ["./*"]
```

to:

```json
"@/*": ["./src/*"]
```

Keep that migration separate from Git workflow setup to reduce risk.


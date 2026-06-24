# Payment-Gateway

Payment-Gateway is a production-oriented Temple Donation Management System built with Next.js, TypeScript, Tailwind CSS, NextAuth, and MongoDB Atlas. It supports public donation flows, UPI payment handoff, QR-code based desktop payment, admin management, seva configuration, donation tracking, and PDF receipt generation.

## Features

- Public donation website
- Dynamic seva selection
- UPI payment flow for mobile devices
- QR-code payment flow for desktop devices
- Donation acknowledgement page
- PDF receipt generation
- Admin authentication
- Admin dashboard
- Donation management
- Seva management
- Temple and payment settings
- Mobile-responsive public and admin UI

## Architecture

The application uses the Next.js App Router and separates responsibilities by feature:

- `app/`: public pages, admin pages, and API routes
- `components/`: reusable UI, donation, admin, and layout components
- `lib/`: database, repositories, validation, payment, auth, and utilities
- `public/`: static assets
- `scripts/`: operational scripts such as database seeding
- `docs/`: engineering and repository documentation

Data access is handled through repository modules in `lib/db/repositories`, with Mongoose models in `lib/db/models`.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- NextAuth
- Zod
- React Hook Form
- jsPDF
- qrcode
- GitHub Actions

## Setup Instructions

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.local.example .env.local
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Environment Variables

Required environment variables:

```env
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Optional:

```env
NEXT_PUBLIC_TEMPLE_NAME=Sri Padmananda Guruji Ashrama
```

Never commit `.env.local` or production secrets.

## Folder Structure

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
└── package.json
```

## Branch Strategy

Primary flow:

```text
feature/*
  -> develop
  -> release/*
  -> main
```

- `main`: production-ready releases only
- `develop`: integration branch for completed features
- `feature/*`: focused feature branches created from `develop`
- `release/*`: release stabilization branches
- `hotfix/*`: urgent production fixes created from `main`

See `docs/BRANCHING.md` for the complete workflow.

## Deployment

Recommended deployment path:

1. Merge feature work into `develop`.
2. Deploy `develop` to staging.
3. Create `release/vX.Y`.
4. Run QA and release verification.
5. Merge release branch into `main`.
6. Tag the release.
7. Deploy `main` to production.

Before production deployment, configure MongoDB Atlas network access, environment secrets, branch protections, and CI status checks.

## Future Roadmap

- Move application source into `src/`
- Add automated tests for repositories and API routes
- Add Playwright end-to-end tests for donation and admin flows
- Add staging and production deployment workflows
- Add audit logging exports
- Add payment verification integrations
- Add role-based admin permissions
- Add backup and restore operational playbooks


# SmartLease — Backend

A comprehensive property management REST API built with Node.js, Express, TypeScript, and PostgreSQL.

## Live API

[https://smartlease-backend.onrender.com](https://smartlease-backend.onrender.com)

## Tech Stack

- **Runtime** — Node.js + TypeScript
- **Framework** — Express.js
- **Database** — PostgreSQL + Prisma ORM
- **Authentication** — Better Auth (session-based)
- **File Upload** — Cloudinary + Multer
- **Payment** — Stripe
- **Validation** — Zod
- **Query Builder** — Custom QueryBuilder (search, filter, sort, pagination)

## Features

- Multi-role authentication — Admin, Landlord, Tenant
- Property & unit management with image upload
- Lease application → approval → lease creation flow
- Security deposit tracking with deadline enforcement
- Automated monthly payment generation on lease confirmation
- Stripe payment integration with webhook support
- Maintenance ticket system with status tracking
- Notice & announcement system with read tracking
- Soft delete with restore functionality
- Global error handling with Prisma error mapping

## Project Structure

src/
├── module/
│ ├── auth/
│ ├── user/
│ ├── property/
│ ├── unit/
│ ├── lease-application/
│ ├── lease/
│ ├── payment/
│ ├── maintenance/
│ └── notice/
├── middleware/
├── utils/
├── config/
└── lib/

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Stripe account
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/AAzizshishir/SmartLease-Backend.git
cd smartlease-backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
pnpm dev
```

### Environment Variables

```env
DATABASE_URL=
PORT=5000
NODE_ENV=development

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📡 API Overview

| Module       | Endpoints                         |
| ------------ | --------------------------------- |
| Auth         | Register, Login, Logout           |
| Users        | Profile, Update, Admin management |
| Properties   | CRUD, Image upload, Soft delete   |
| Units        | CRUD, Image upload, Restore       |
| Applications | Apply, Approve, Reject            |
| Leases       | Create, Confirm, Terminate        |
| Payments     | Pay, Manual mark, Deposit refund  |
| Maintenance  | Tickets, Assign, Resolve          |
| Notices      | Create, Read tracking             |

## 🔐 Roles

| Role     | Access                         |
| -------- | ------------------------------ |
| Admin    | Full platform control          |
| Landlord | Own properties, units, leases  |
| Tenant   | Browse, apply, lease, payments |

## 📦 Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm stripe:webhook  # Stripe webhook listener (local)
```

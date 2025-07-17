# VGM SaaS Starter

A comprehensive SaaS starter template built with **Next.js** featuring authentication, Stripe payments, lead management, and team collaboration.

## Features

- **Authentication & Authorization**: Email/password auth with JWT sessions and role-based access control
- **Team Management**: Multi-tenant organizations with member invitations and role management
- **Lead Management**: CRUD operations for leads with team-based data isolation
- **Payment Integration**: Stripe Checkout and Customer Portal for subscription management
- **Activity Logging**: Comprehensive audit trail for all user actions
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/) for subscriptions and billing
- **UI**: [shadcn/ui](https://ui.shadcn.com/) components with [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: Custom JWT-based auth with bcrypt password hashing
- **Deployment**: Optimized for [Vercel](https://vercel.com/)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)
- Stripe account for payments

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <your-repo-url>
   cd vgm-saas
   pnpm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:

   ```env
   POSTGRES_URL=postgresql://username:password@host:port/database
   AUTH_SECRET=your-secret-key-here
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   BASE_URL=http://localhost:3000
   ```

3. **Set up the database:**

   ```bash
   # Run migrations
   pnpm db:migrate

   # Reset database with test data
   npx tsx lib/db/reset.ts
   ```

4. **Start the development server:**

   ```bash
   pnpm dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### Reset Database

To reset your database to a clean state with test data:

```bash
npx tsx lib/db/reset.ts
```

### Manual Seeding

To run the seed script without resetting:

```bash
npx tsx lib/db/seed.ts
```

## User Roles & Permissions

### Role Hierarchy

- **Super Admin**: Full system access, can manage all users and organizations
- **Admin**: Global admin access, cannot modify super admins
- **Owner**: Full access within their organization, can manage team members
- **Member**: View-only access within their organization

### Organization Management

- Users must be associated with at least one organization (except admins)
- Organization names must be unique and 4-20 characters
- Owners can invite new members and manage team settings

### Test Accounts

The database comes with pre-configured test accounts for development and testing purposes. These accounts are created when you run the database reset script (see Database Management section below).

#### Organization Owners

- **Test Org 1**: `owner1@test.com` / `owner123`
- **Test Org 2**: `owner2@test.com` / `owner123`

#### Admin Users

- **Admin**: `admin@test.com` / `admin123`
- **Super Admin**: `super@test.com` / `superadmin123`

#### Test Data

Each organization comes with 6 sample leads marked as "TEST" for easy identification and testing.

## Stripe Integration

### Test Mode

Use these test card details:

- **Card Number**: `4242 4242 4242 4242`
- **Expiration**: Any future date
- **CVC**: Any 3-digit number

### Webhook Setup

For local development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Production Deployment

### Environment Variables

Ensure these are set in production:

- `POSTGRES_URL`: Production database connection string
- `AUTH_SECRET`: Secure random string for JWT signing
- `STRIPE_SECRET_KEY`: Production Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Production webhook secret
- `BASE_URL`: Your production domain

### Vercel Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Setup

1. Set up a production PostgreSQL database
2. Run migrations: `pnpm db:migrate`
3. Optionally seed with initial data: `npx tsx lib/db/seed.ts`

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── (login)/          # Authentication pages
│   ├── api/              # API routes
│   └── settings/         # User settings pages
├── components/           # Reusable UI components
├── lib/                  # Utility libraries
│   ├── auth/            # Authentication logic
│   ├── db/              # Database configuration
│   └── payments/        # Stripe integration
└── middleware.ts        # Route protection
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

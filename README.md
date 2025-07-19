# VGM SaaS Starter

A comprehensive SaaS starter template built with **Next.js** featuring authentication, Stripe payments, lead management, and team collaboration.

## Features

- **Authentication & Authorization**: Email/password auth with JWT sessions and role-based access control
- **Team Management**: Multi-tenant organizations with member invitations and role management
- **Lead Management**: CRUD operations for leads with team-based data isolation, customizable lead sources and service interests
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
   # Quick setup and start (recommended)
   pnpm dev:setup

   # Or start manually
   pnpm dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### Multi-Computer Development Workflow

When working across multiple computers, the database automatically handles schema changes:

1. **Automatic Migration Check**: The `postinstall` script runs `db:migrate:auto` which checks for pending migrations and applies them
2. **Schema Change Detection**: When schema changes are detected, you'll be prompted to reset the database
3. **Seamless Updates**: Pull changes from the repo and run `npm install` to automatically handle database updates

### Available Database Commands

```bash
# Interactive migration and seeding (recommended for development)
pnpm db:migrate

# Automated migration and seeding (for CI/CD)
pnpm db:migrate:auto

# Automated migration with auto-reset (destructive - use with caution)
pnpm db:migrate:reset

# Reset database to clean state with test data
pnpm db:reset

# Manual seeding only
pnpm db:seed

# Generate new migration files
pnpm db:generate

# Push schema changes directly (development only)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio

# Check database status
pnpm db:status
```

### Workflow for Schema Changes

1. **Make schema changes** in `lib/db/schema.ts`
2. **Generate migration**: `pnpm db:generate`
3. **Commit and push** the migration files
4. **On other computers**: Pull changes and run `npm install` (automatically handles migrations)
5. **If needed**: Run `pnpm db:migrate` to interactively handle any conflicts

### Database Tables

- **users**: User accounts with role-based permissions
- **teams**: Organizations with subscription management
- **team_members**: User-organization relationships
- **leads**: Lead records with contact and business information
- **lead_sources**: Customizable lead source categories per team
- **service_interests**: Customizable service interest categories per team
- **lead_statuses**: Customizable lead status categories per team
- **activity_logs**: Audit trail for user actions
- **invitations**: Team member invitations
- **password_reset_tokens**: Password reset functionality

### Reset Database

To reset your database to a clean state with test data:

```bash
pnpm db:reset
```

### Manual Seeding

To run the seed script without resetting:

```bash
pnpm db:seed
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

## Lead Management

### Lead Sources

- **Customizable**: Each team can create and manage their own lead sources
- **Sortable**: Drag-and-drop reordering in the settings
- **Team-scoped**: Lead sources are isolated to each organization
- **Default sources**: Website Form, Social Media, Referral, Email Campaign, Cold Call, Trade Show

### Service Interests

- **Customizable**: Each team can create and manage their own service interests
- **Sortable**: Drag-and-drop reordering in the settings
- **Team-scoped**: Service interests are isolated to each organization
- **Default interests**: Web Development, Mobile Development, Consulting, Design, Marketing, Support

### Lead Statuses

- **Customizable**: Each team can create and manage their own lead statuses
- **Team-scoped**: Lead statuses are isolated to each organization
- **Default statuses**: New, Qualified, Proposal Sent, Negotiating, Closed Won, Closed Lost

### Lead Fields

- **Contact Information**: Name, email, phone number
- **Lead Details**: Source, service interest, status, potential value
- **Follow-up**: Follow-up date and notes
- **Phone Validation**: Automatic E.164 formatting for international phone numbers

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
│   │   ├── lead-sources/  # Lead sources management
│   │   ├── service-interests/ # Service interests management
│   │   ├── lead-statuses/  # Lead statuses management
│   │   └── stripe/       # Stripe integration
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

# VGM SaaS Starter

A comprehensive SaaS starter template built with **Next.js** featuring authentication, Stripe payments, lead management, and team collaboration.

## Features

- **Authentication & Authorization**: Email/password auth with JWT sessions and role-based access control
- **Team Management**: Multi-tenant organizations with member invitations and role management
- **Lead Management**: Advanced CRUD operations with bulk delete, sorting, pagination, and customizable reference data
- **Payment Integration**: Stripe Checkout and Customer Portal for subscription management
- **Activity Logging**: Comprehensive audit trail for all user actions
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Phone Validation**: E.164 formatting for international phone numbers
- **Drag & Drop**: Sortable reference data (lead sources, service interests, lead statuses)

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

### Core Features

- **CRUD Operations**: Full create, read, update, and delete functionality for leads
- **Bulk Operations**: Select and delete multiple leads at once with confirmation
- **Row Selection**: Click on any row to edit lead details in a modal dialog
- **Sortable Columns**: Click column headers to sort by any field
- **Pagination**: Navigate through large datasets efficiently
- **Search & Filter**: Find leads quickly with built-in search functionality

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
- **Sortable**: Drag-and-drop reordering in the settings
- **Team-scoped**: Lead statuses are isolated to each organization
- **Default statuses**: New, Qualified, Proposal Sent, Negotiating, Closed Won, Closed Lost

### Lead Fields

- **Contact Information**: Name, email, phone number with E.164 validation
- **Lead Details**: Source, service interest, status, potential value
- **Follow-up**: Follow-up date picker and notes field
- **Phone Validation**: Automatic E.164 formatting for international phone numbers
- **Date Handling**: Proper date formatting and validation

### User Interface

- **Modern Table**: React Table with sorting, pagination, and selection
- **Inline Actions**: Quick edit and delete actions in dropdown menus
- **Bulk Delete**: Select multiple leads and delete with confirmation
- **Selection Feedback**: Real-time count of selected leads
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Loading States**: Proper loading indicators for all operations

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
│   │   └── dashboard/     # Main dashboard with leads management
│   ├── (login)/          # Authentication pages
│   ├── api/              # API routes
│   │   ├── leads/        # Lead CRUD operations
│   │   ├── lead-sources/  # Lead sources management
│   │   ├── service-interests/ # Service interests management
│   │   ├── lead-statuses/  # Lead statuses management
│   │   ├── teams/        # Team management
│   │   ├── user/         # User management
│   │   └── stripe/       # Stripe integration
│   └── settings/         # User settings pages
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Layout components
├── lib/                  # Utility libraries
│   ├── auth/            # Authentication logic
│   ├── db/              # Database configuration and migrations
│   ├── payments/        # Stripe integration
│   └── context/         # React context providers
└── middleware.ts        # Route protection
```

## Recent Updates

### Lead Management Enhancements (Latest)

- **Bulk Delete Functionality**: Select multiple leads and delete them with confirmation
- **Improved Row Selection**: Click on any table row to edit lead details
- **Enhanced UI**: Compact selection feedback in table header
- **Phone Number Validation**: Automatic E.164 formatting for international phone numbers
- **Better Error Handling**: Comprehensive error handling with user feedback
- **Responsive Design**: Improved mobile experience
- **Database Optimization**: Updated seed script with proper ordering for reference data

### Technical Improvements

- **React Table Integration**: Advanced table functionality with sorting, pagination, and selection
- **Type Safety**: Enhanced TypeScript types for better development experience
- **Performance**: Optimized database queries and state management
- **Code Quality**: Improved code organization and error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

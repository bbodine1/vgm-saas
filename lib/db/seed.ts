import { stripe } from '../payments/stripe'
import { db } from './drizzle'
import { users, teams, teamMembers } from './schema'
import { hashPassword } from '@/lib/auth/session'
import { eq } from 'drizzle-orm'

async function createStripeProducts() {
	console.log('Creating Stripe products and prices...')

	const baseProduct = await stripe.products.create({
		name: 'Base',
		description: 'Base subscription plan',
	})

	await stripe.prices.create({
		product: baseProduct.id,
		unit_amount: 800, // $8 in cents
		currency: 'usd',
		recurring: {
			interval: 'month',
			trial_period_days: 7,
		},
	})

	const plusProduct = await stripe.products.create({
		name: 'Plus',
		description: 'Plus subscription plan',
	})

	await stripe.prices.create({
		product: plusProduct.id,
		unit_amount: 1200, // $12 in cents
		currency: 'usd',
		recurring: {
			interval: 'month',
			trial_period_days: 7,
		},
	})

	console.log('Stripe products and prices created successfully.')
}

async function seed() {
	const email = 'test@test.com'
	const password = 'admin123'
	const passwordHash = await hashPassword(password)

	// Check if the owner user exists
	const existingOwner = await db.select().from(users).where(eq(users.email, email)).limit(1)

	let user
	if (existingOwner.length === 0) {
		;[user] = await db
			.insert(users)
			.values([
				{
					email: email,
					passwordHash: passwordHash,
					role: 'owner',
				},
			])
			.returning()
		console.log('Initial user created.')
	} else {
		user = existingOwner[0]
		console.log('Initial user already exists.')
	}

	const [team] = await db
		.insert(teams)
		.values({
			name: 'Test Team',
		})
		.returning()

	await db.insert(teamMembers).values({
		teamId: team.id,
		userId: user.id,
		role: 'owner',
	})

	// Check if the super admin user exists
	const superAdminEmail = 'superadmin@test.com'
	const existingSuperAdmin = await db.select().from(users).where(eq(users.email, superAdminEmail)).limit(1)

	if (existingSuperAdmin.length === 0) {
		await db
			.insert(users)
			.values([
				{
					email: superAdminEmail,
					passwordHash: await hashPassword('superadmin123'),
					role: 'super_admin',
				},
			])
			.returning()
		console.log('Super admin user created.')
	} else {
		console.log('Super admin user already exists.')
	}

	await createStripeProducts()
}

seed()
	.catch(error => {
		console.error('Seed process failed:', error)
		process.exit(1)
	})
	.finally(() => {
		console.log('Seed process finished. Exiting...')
		process.exit(0)
	})

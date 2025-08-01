import { stripe } from '../payments/stripe'
import { db } from './drizzle'
import { users, teams, teamMembers, leads, leadSources, serviceInterests, leadStatuses } from './schema'
import { hashPassword } from '@/lib/auth/session'
import { eq, and } from 'drizzle-orm'

async function createStripeProducts() {
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
}

async function seed() {
	// Organization name must be 4-20 chars and unique
	// All users except super admin must be associated with at least one organization
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
	} else {
		user = existingOwner[0]
	}

	// Ensure unique org name and valid length
	const orgName = 'Test Team'
	if (orgName.length < 4 || orgName.length > 100) {
		throw new Error('Organization name must be between 4 and 100 characters.')
	}
	const existingTeam = await db.select().from(teams).where(eq(teams.name, orgName)).limit(1)
	let team
	if (existingTeam.length === 0) {
		;[team] = await db
			.insert(teams)
			.values({
				name: orgName,
			})
			.returning()
	} else {
		team = existingTeam[0]
	}

	// Associate user with team
	const existingTeamMember = await db.select().from(teamMembers).where(eq(teamMembers.userId, user.id)).limit(1)
	if (existingTeamMember.length === 0) {
		await db.insert(teamMembers).values({
			teamId: team.id,
			userId: user.id,
			role: 'owner',
		})
	}

	// Create two test organizations and owners
	const orgs = [
		{ name: 'Test Org 1', email: 'owner1@test.com', password: 'owner123' },
		{ name: 'Test Org 2', email: 'owner2@test.com', password: 'owner123' },
	]

	for (const org of orgs) {
		const passwordHash = await hashPassword(org.password)
		// Create owner user
		let [ownerUser] = await db
			.insert(users)
			.values({
				email: org.email,
				passwordHash,
				role: 'owner',
			})
			.onConflictDoNothing()
			.returning()
		if (!ownerUser) {
			// If user already exists, fetch it
			ownerUser = (await db.select().from(users).where(eq(users.email, org.email)).limit(1))[0]
		}
		// Create org
		let [team] = await db.insert(teams).values({ name: org.name }).onConflictDoNothing().returning()
		if (!team) {
			team = (await db.select().from(teams).where(eq(teams.name, org.name)).limit(1))[0]
		}
		// Associate owner with org
		const existingTeamMember = await db.select().from(teamMembers).where(eq(teamMembers.userId, ownerUser.id)).limit(1)
		if (existingTeamMember.length === 0) {
			await db.insert(teamMembers).values({
				teamId: team.id,
				userId: ownerUser.id,
				role: 'owner',
			})
		}

		// Add 6 test leads for this org
		const phoneNumbers = [
			'+1-555-123-4567',
			'+1-555-234-5678',
			'+1-555-345-6789',
			'+1-555-456-7890',
			'+1-555-567-8901',
			'+1-555-678-9012',
		]

		const serviceInterestsList = [
			'Web Development',
			'Mobile Development',
			'Consulting',
			'Design',
			'Marketing',
			'Support',
		]
		const leadSourcesList = ['Website Form', 'Social Media', 'Referral', 'Email Campaign', 'Cold Call', 'Trade Show']
		const leadStatusesList = ['New', 'Qualified', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost']

		for (let i = 1; i <= 6; i++) {
			await db.insert(leads).values({
				leadSource: leadSourcesList[i - 1],
				dateReceived: new Date(),
				contactName: `Test Contact ${i}`,
				emailAddress: `test${i}@example.com`,
				phoneNumber: phoneNumbers[i - 1],
				serviceInterest: serviceInterestsList[i - 1],
				leadStatus: leadStatusesList[i - 1],
				potentialValue: 1000 * i,
				followUpDate: new Date(Date.now() + 86400000 * i),
				notes: 'Seeded test lead',
				teamId: team.id,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
		}

		// Add default lead sources for this org
		const defaultSources = ['Website Form', 'Social Media', 'Referral', 'Email Campaign', 'Cold Call', 'Trade Show']
		for (let i = 0; i < defaultSources.length; i++) {
			const sourceName = defaultSources[i]
			// Check if lead source already exists for this team
			const existing = await db
				.select()
				.from(leadSources)
				.where(and(eq(leadSources.teamId, team.id), eq(leadSources.name, sourceName)))
				.limit(1)

			if (existing.length === 0) {
				await db.insert(leadSources).values({
					name: sourceName,
					teamId: team.id,
					order: i + 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
			}
		}

		// Add default service interests for this org
		const defaultServiceInterests = [
			'Web Development',
			'Mobile Development',
			'Consulting',
			'Design',
			'Marketing',
			'Support',
		]
		for (let i = 0; i < defaultServiceInterests.length; i++) {
			const serviceName = defaultServiceInterests[i]
			// Check if service interest already exists for this team
			const existing = await db
				.select()
				.from(serviceInterests)
				.where(and(eq(serviceInterests.teamId, team.id), eq(serviceInterests.name, serviceName)))
				.limit(1)

			if (existing.length === 0) {
				await db.insert(serviceInterests).values({
					name: serviceName,
					teamId: team.id,
					order: i + 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
			}
		}

		// Add default lead statuses for this org
		const defaultLeadStatuses = ['New', 'Qualified', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost']
		for (let i = 0; i < defaultLeadStatuses.length; i++) {
			const statusName = defaultLeadStatuses[i]
			// Check if lead status already exists for this team
			const existing = await db
				.select()
				.from(leadStatuses)
				.where(and(eq(leadStatuses.teamId, team.id), eq(leadStatuses.name, statusName)))
				.limit(1)

			if (existing.length === 0) {
				await db.insert(leadStatuses).values({
					name: statusName,
					teamId: team.id,
					order: i + 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
			}
		}
	}

	// Add admin user
	const adminEmail = 'admin@test.com'
	const adminPassword = 'admin123'
	const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1)
	if (existingAdmin.length === 0) {
		await db
			.insert(users)
			.values([
				{
					email: adminEmail,
					passwordHash: await hashPassword(adminPassword),
					role: 'admin',
				},
			])
			.returning()
	}

	// Add super admin user
	const superAdminEmail = 'super@test.com'
	const superAdminPassword = 'superadmin123'
	const existingSuper = await db.select().from(users).where(eq(users.email, superAdminEmail)).limit(1)
	if (existingSuper.length === 0) {
		await db
			.insert(users)
			.values([
				{
					email: superAdminEmail,
					passwordHash: await hashPassword(superAdminPassword),
					role: 'super_admin',
				},
			])
			.returning()
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

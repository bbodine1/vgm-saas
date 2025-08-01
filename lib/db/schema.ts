import { pgTable, serial, varchar, text, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 100 }),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: varchar('role', { length: 20 }).notNull().default('member'), // valid: member, owner, admin, super_admin
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deletedAt: timestamp('deleted_at'),
})

export const teams = pgTable('teams', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 100 }).notNull().unique(), // enforce uniqueness at DB level
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	stripeCustomerId: text('stripe_customer_id').unique(),
	stripeSubscriptionId: text('stripe_subscription_id').unique(),
	stripeProductId: text('stripe_product_id'),
	planName: varchar('plan_name', { length: 50 }),
	subscriptionStatus: varchar('subscription_status', { length: 20 }),
})

export const teamMembers = pgTable('team_members', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	teamId: integer('team_id')
		.notNull()
		.references(() => teams.id),
	role: varchar('role', { length: 50 }).notNull(),
	joinedAt: timestamp('joined_at').notNull().defaultNow(),
})

export const activityLogs = pgTable('activity_logs', {
	id: serial('id').primaryKey(),
	teamId: integer('team_id')
		.notNull()
		.references(() => teams.id),
	userId: integer('user_id').references(() => users.id),
	action: text('action').notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),
	ipAddress: varchar('ip_address', { length: 45 }),
})

export const invitations = pgTable('invitations', {
	id: serial('id').primaryKey(),
	teamId: integer('team_id')
		.notNull()
		.references(() => teams.id),
	email: varchar('email', { length: 255 }).notNull(),
	role: varchar('role', { length: 50 }).notNull(),
	invitedBy: integer('invited_by')
		.notNull()
		.references(() => users.id),
	invitedAt: timestamp('invited_at').notNull().defaultNow(),
	status: varchar('status', { length: 20 }).notNull().default('pending'),
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
})

export const leads = pgTable('leads', {
	id: serial('id').primaryKey(), // Lead ID
	leadSource: varchar('lead_source', { length: 100 }), // Lead Source
	dateReceived: timestamp('date_received').notNull(), // Date Received
	contactName: varchar('contact_name', { length: 255 }).notNull(), // Contact Name
	emailAddress: varchar('email_address', { length: 255 }), // Email Address
	phoneNumber: varchar('phone_number', { length: 50 }), // Phone Number
	serviceInterest: varchar('service_interest', { length: 100 }), // Service Interest
	leadStatus: varchar('lead_status', { length: 50 }).notNull().default('New'), // Lead Status
	potentialValue: integer('potential_value'), // Potential Value
	followUpDate: timestamp('follow_up_date'), // Follow-Up Date
	notes: text('notes'), // Notes/Comments
	teamId: integer('team_id')
		.notNull()
		.references(() => teams.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const leadSources = pgTable(
	'lead_sources',
	{
		id: serial('id').primaryKey(),
		name: varchar('name', { length: 100 }).notNull(),
		teamId: integer('team_id')
			.notNull()
			.references(() => teams.id),
		order: integer('order').notNull().default(0),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	table => ({
		teamNameUnique: uniqueIndex('lead_sources_team_id_name_unique').on(table.teamId, table.name),
	})
)

export const serviceInterests = pgTable(
	'service_interests',
	{
		id: serial('id').primaryKey(),
		name: varchar('name', { length: 100 }).notNull(),
		teamId: integer('team_id')
			.notNull()
			.references(() => teams.id),
		order: integer('order').notNull().default(0),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	table => ({
		teamNameUnique: uniqueIndex('service_interests_team_id_name_unique').on(table.teamId, table.name),
	})
)

export const leadStatuses = pgTable(
	'lead_statuses',
	{
		id: serial('id').primaryKey(),
		name: varchar('name', { length: 100 }).notNull(),
		teamId: integer('team_id')
			.notNull()
			.references(() => teams.id),
		order: integer('order').notNull().default(0),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	table => ({
		teamNameUnique: uniqueIndex('lead_statuses_team_id_name_unique').on(table.teamId, table.name),
	})
)

export const leadsRelations = relations(leads, ({ one }) => ({
	team: one(teams, {
		fields: [leads.teamId],
		references: [teams.id],
	}),
}))

export const leadSourcesRelations = relations(leadSources, ({ one }) => ({
	team: one(teams, {
		fields: [leadSources.teamId],
		references: [teams.id],
	}),
}))

export const serviceInterestsRelations = relations(serviceInterests, ({ one }) => ({
	team: one(teams, {
		fields: [serviceInterests.teamId],
		references: [teams.id],
	}),
}))

export const leadStatusesRelations = relations(leadStatuses, ({ one }) => ({
	team: one(teams, {
		fields: [leadStatuses.teamId],
		references: [teams.id],
	}),
}))

export const teamsRelations = relations(teams, ({ many }) => ({
	teamMembers: many(teamMembers),
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	leads: many(leads),
	leadSources: many(leadSources),
	serviceInterests: many(serviceInterests),
	leadStatuses: many(leadStatuses),
}))

export const usersRelations = relations(users, ({ many }) => ({
	teamMembers: many(teamMembers),
	invitationsSent: many(invitations),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
	team: one(teams, {
		fields: [invitations.teamId],
		references: [teams.id],
	}),
	invitedBy: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id],
	}),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	team: one(teams, {
		fields: [activityLogs.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id],
	}),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id],
	}),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert
export type TeamDataWithMembers = Team & {
	teamMembers: (TeamMember & {
		user: Pick<User, 'id' | 'name' | 'email'>
	})[]
}

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type LeadSource = typeof leadSources.$inferSelect
export type NewLeadSource = typeof leadSources.$inferInsert
export type ServiceInterest = typeof serviceInterests.$inferSelect
export type NewServiceInterest = typeof serviceInterests.$inferInsert
export type LeadStatus = typeof leadStatuses.$inferSelect
export type NewLeadStatus = typeof leadStatuses.$inferInsert

export enum ActivityType {
	SIGN_UP = 'SIGN_UP',
	SIGN_IN = 'SIGN_IN',
	SIGN_OUT = 'SIGN_OUT',
	UPDATE_PASSWORD = 'UPDATE_PASSWORD',
	DELETE_ACCOUNT = 'DELETE_ACCOUNT',
	UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
	CREATE_TEAM = 'CREATE_TEAM',
	REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
	INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
	ACCEPT_INVITATION = 'ACCEPT_INVITATION',
	DELETE_INVITATION = 'DELETE_INVITATION',
	UPDATE_ORG_NAME = 'UPDATE_ORG_NAME', // Added for org name changes
}

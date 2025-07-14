import nodemailer from 'nodemailer'

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
	if (
		!process.env.SMTP_HOST ||
		!process.env.SMTP_PORT ||
		!process.env.SMTP_USER ||
		!process.env.SMTP_PASS ||
		!process.env.EMAIL_FROM
	) {
		throw new Error('Missing SMTP configuration in environment variables')
	}
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT),
		secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	})
	await transporter.sendMail({
		from: process.env.EMAIL_FROM,
		to,
		subject,
		html,
	})
}

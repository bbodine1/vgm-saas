import Header from '@/components/layout/Header'

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<section className="flex flex-col min-h-screen">
			<Header />
			{children}
		</section>
	)
}

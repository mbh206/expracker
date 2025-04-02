import { Inter } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import AuthProvider from '@/providers/AuthProvider';
import Navbar from '@/components/Navbar';
import ClientThemeProvider from '../components/ClientThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Family Expense Tracker',
	description: 'Track, share, and get AI advice on your family expenses',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang='en'
			className='light'>
			<body
				className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
				<AuthProvider>
					<ClientThemeProvider>
						<Navbar />
						<main className='container mx-auto px-4 py-8'>{children}</main>
					</ClientThemeProvider>
				</AuthProvider>
			</body>
		</html>
	);
}

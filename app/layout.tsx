import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import type { Metadata } from 'next';
import AuthProvider from '@/providers/AuthProvider';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Expense Tracker',
	description: 'Track, share, and get AI advice on your personal expenses',
	viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body
				className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 overflow-x-hidden`}>
				<AuthProvider>
					<Navbar />
					<main className='px-2 py-6 max-w-full'>{children}</main>
				</AuthProvider>
				<Toaster position='top-right' />
			</body>
		</html>
	);
}

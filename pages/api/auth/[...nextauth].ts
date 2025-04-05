import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcrypt';

import prisma from '@/lib/prismadb';

export const authOptions: AuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		}),
		CredentialsProvider({
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error('Invalid credentials');
				}

				const user = await prisma.user.findUnique({
					where: {
						email: credentials.email,
					},
				});

				if (!user || !user?.password) {
					throw new Error('Invalid credentials');
				}

				const isCorrectPassword = await bcrypt.compare(
					credentials.password,
					user.password
				);

				if (!isCorrectPassword) {
					throw new Error('Invalid credentials');
				}

				return user;
			},
		}),
	],
	pages: {
		signIn: '/auth/signin',
		signOut: '/',
		error: '/auth/error',
	},
	debug: process.env.NODE_ENV === 'development',
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	callbacks: {
		// Include user.id in session
		async session({ session, token }) {
			if (session?.user) {
				session.user.id = token.sub as string;

				// Fetch the user from the database to get the latest data
				const user = await prisma.user.findUnique({
					where: { id: token.sub as string },
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				});

				// Update session with the latest user data
				if (user) {
					session.user.name = user.name;
					session.user.email = user.email;
					session.user.image = user.image;
				}
			}
			return session;
		},
		// Store the user id in the token
		async jwt({ token, user }) {
			if (user) {
				token.sub = user.id;
			}
			return token;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
};

// Add TypeScript declaration for session user to include id
declare module 'next-auth' {
	interface Session {
		user: {
			id?: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
		};
	}
}

export default NextAuth(authOptions);

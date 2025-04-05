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
		signIn: '/',
	},
	debug: process.env.NODE_ENV === 'development',
	session: {
		strategy: 'jwt',
	},
	callbacks: {
		// Include user.id in session
		async session({ session, token, user }) {
			if (session?.user) {
				// When using JWT strategy, user comes from token
				if (token.sub) {
					session.user.id = token.sub;
				}
				// When not using JWT or as a fallback
				else if (user?.id) {
					session.user.id = user.id;
				}
			}
			return session;
		},
		// Store the user id in the token
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
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

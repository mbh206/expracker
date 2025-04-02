import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
	title: 'Login - Family Expense Tracker',
	description: 'Log in to your Family Expense Tracker account',
};

export default function LoginPage() {
	return (
		<div className='max-w-md mx-auto my-10'>
			<h1 className='text-3xl font-bold text-center mb-6'>Login</h1>
			<LoginForm />
		</div>
	);
}

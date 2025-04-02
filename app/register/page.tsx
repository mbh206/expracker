import { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
	title: 'Register - Family Expense Tracker',
	description: 'Create a new account for Family Expense Tracker',
};

export default function RegisterPage() {
	return (
		<div className='max-w-md mx-auto my-10'>
			<h1 className='text-3xl font-bold text-center mb-6'>Create an Account</h1>
			<RegisterForm />
		</div>
	);
}

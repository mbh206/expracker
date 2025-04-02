import { Metadata } from 'next';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
	title: 'Forgot Password - Family Expense Tracker',
	description: 'Reset your Family Expense Tracker password',
};

export default function ForgotPasswordPage() {
	return (
		<div className='max-w-md mx-auto my-10'>
			<h1 className='text-3xl font-bold text-center mb-6'>Forgot Password</h1>
			<ForgotPasswordForm />
		</div>
	);
}

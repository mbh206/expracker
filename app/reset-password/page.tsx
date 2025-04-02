import { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
	title: 'Reset Password - Family Expense Tracker',
	description: 'Create a new password for your Family Expense Tracker account',
};

export default function ResetPasswordPage({
	searchParams,
}: {
	searchParams: { token?: string };
}) {
	const token = searchParams.token || '';

	return (
		<div className='max-w-md mx-auto my-10'>
			<h1 className='text-3xl font-bold text-center mb-6'>Reset Password</h1>
			<ResetPasswordForm token={token} />
		</div>
	);
}

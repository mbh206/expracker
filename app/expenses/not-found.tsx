import Link from 'next/link';

export default function ExpenseNotFound() {
	return (
		<div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
			<h2 className='text-2xl font-bold mb-4'>Expense Not Found</h2>
			<p className='text-gray-600 mb-6'>
				The expense you&apos;re looking for doesn&apos;t exist or you don&apos;t
				have permission to view it.
			</p>
			<Link
				href='/expenses'
				className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
				Back to Expenses
			</Link>
		</div>
	);
}

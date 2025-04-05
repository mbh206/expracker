'use client';

import { useSession } from 'next-auth/react';

export default function DebugPage() {
	const { data: session, status } = useSession();

	return (
		<div className='max-w-4xl mx-auto p-6'>
			<h1 className='text-2xl font-bold mb-4'>Session Debug</h1>

			<div className='bg-white p-6 rounded-lg shadow-md'>
				<h2 className='text-xl font-semibold mb-2'>Session Status</h2>
				<p className='mb-4'>{status}</p>

				<h2 className='text-xl font-semibold mb-2'>Session Data</h2>
				<pre className='bg-gray-100 p-4 rounded overflow-auto max-h-96'>
					{JSON.stringify(session, null, 2)}
				</pre>

				{session?.user?.image && (
					<div className='mt-4'>
						<h2 className='text-xl font-semibold mb-2'>User Image</h2>
						<img
							src={session.user.image}
							alt='User'
							className='w-32 h-32 rounded-full object-cover'
						/>
					</div>
				)}
			</div>
		</div>
	);
}

// components/RateLimitAlert.tsx
'use client';

import { useState, useEffect } from 'react';

interface RateLimitAlertProps {
	retryAfter?: number; // Seconds until rate limit resets
	message?: string;
	onClose?: () => void;
}

export default function RateLimitAlert({
	retryAfter = 3600, // Default 1 hour
	message = "You've reached the maximum number of AI analysis requests for now.",
	onClose,
}: RateLimitAlertProps) {
	const [timeRemaining, setTimeRemaining] = useState(retryAfter);
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		// Update countdown timer
		if (timeRemaining <= 0) {
			setVisible(false);
			if (onClose) onClose();
			return;
		}

		const timer = setTimeout(() => {
			setTimeRemaining((prev) => prev - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [timeRemaining, onClose]);

	// Format remaining time as HH:MM:SS
	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		return [
			hours.toString().padStart(2, '0'),
			minutes.toString().padStart(2, '0'),
			remainingSeconds.toString().padStart(2, '0'),
		].join(':');
	};

	if (!visible) return null;

	return (
		<div className='bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 text-amber-700 dark:text-amber-200 p-4 mb-4 rounded-md shadow-md'>
			<div className='flex'>
				<div className='flex-shrink-0'>
					<svg
						className='h-5 w-5 text-amber-500'
						viewBox='0 0 20 20'
						fill='currentColor'>
						<path
							fillRule='evenodd'
							d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
							clipRule='evenodd'
						/>
					</svg>
				</div>
				<div className='ml-3'>
					<p className='text-sm font-medium'>{message}</p>
					<p className='text-sm mt-1'>
						Please try again in{' '}
						<span className='font-mono font-medium'>
							{formatTime(timeRemaining)}
						</span>
					</p>
					<p className='text-xs mt-2'>
						To avoid reaching limits, consider using the AI features sparingly
						for your most important insights.
					</p>
				</div>
				{onClose && (
					<button
						type='button'
						className='ml-auto pl-3 -my-1.5 -mr-1.5 rounded-lg focus:ring-2 focus:ring-amber-400 p-1.5 inline-flex h-8 w-8'
						onClick={() => {
							setVisible(false);
							onClose();
						}}>
						<span className='sr-only'>Dismiss</span>
						<svg
							className='h-5 w-5 text-amber-500'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
				)}
			</div>
		</div>
	);
}

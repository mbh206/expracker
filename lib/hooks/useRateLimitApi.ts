// lib/hooks/useRateLimitedApi.ts
'use client';

import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

interface RateLimitState {
	isRateLimited: boolean;
	rateLimitReset: number | null;
	rateLimitRemaining: number | null;
}

interface UseRateLimitedApiReturn<T> {
	data: T | null;
	error: Error | null;
	loading: boolean;
	rateLimitState: RateLimitState;
	executeRequest: (config?: AxiosRequestConfig) => Promise<void>;
}

/**
 * Custom hook for making API requests with rate limit awareness
 */
export function useRateLimitedApi<T = any>(
	url: string,
	options: AxiosRequestConfig = {}
): UseRateLimitedApiReturn<T> {
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
		isRateLimited: false,
		rateLimitReset: null,
		rateLimitRemaining: null,
	});

	const executeRequest = useCallback(
		async (config: AxiosRequestConfig = {}) => {
			setLoading(true);
			setError(null);

			try {
				const mergedConfig = { ...options, ...config };
				const response = await axios(url, mergedConfig);

				// Update rate limit state based on headers
				const rateLimitRemaining = parseInt(
					response.headers['x-ratelimit-remaining'] || '-1',
					10
				);
				const rateLimitReset = parseInt(
					response.headers['x-ratelimit-reset'] || '-1',
					10
				);

				setRateLimitState({
					isRateLimited: false,
					rateLimitRemaining: isNaN(rateLimitRemaining)
						? null
						: rateLimitRemaining,
					rateLimitReset: isNaN(rateLimitReset) ? null : rateLimitReset,
				});

				setData(response.data);
			} catch (err) {
				if (axios.isAxiosError(err) && err.response) {
					// Check if this is a rate limit error
					if (err.response.status === 429) {
						const retryAfter = parseInt(
							err.response.headers['retry-after'] ||
								err.response.data?.retryAfter?.toString() ||
								'3600',
							10
						);

						setRateLimitState({
							isRateLimited: true,
							rateLimitReset:
								Math.floor(Date.now() / 1000) +
								(isNaN(retryAfter) ? 3600 : retryAfter),
							rateLimitRemaining: 0,
						});
					}

					setError(new Error(err.response.data?.message || err.message));
				} else if (err instanceof Error) {
					setError(err);
				} else {
					setError(new Error('An unknown error occurred'));
				}
			} finally {
				setLoading(false);
			}
		},
		[url, options]
	);

	return { data, error, loading, rateLimitState, executeRequest };
}

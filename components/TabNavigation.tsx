'use client';

import { useState } from 'react';

export default function TabNavigation({
	tabs,
	defaultTab,
}: {
	tabs: { id: string; label: string; content: React.ReactNode }[];
	defaultTab?: string;
}) {
	const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

	return (
		<div className='w-full'>
			{/* Tab navigation */}
			<div className='flex border-b'>
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`${
							activeTab === tab.id
								? 'border-blue-500 text-blue-600 border-b-2 font-medium'
								: 'border-transparent text-gray-500 hover:text-gray-700'
						} py-3 px-4 flex-1 md:flex-none md:px-6 text-center border-b-2 text-sm font-medium transition-colors`}
						aria-current={activeTab === tab.id ? 'page' : undefined}>
						{tab.label}
					</button>
				))}
			</div>

			{/* Content for active tab */}
			<div className='mt-4'>
				{tabs.map((tab) => (
					<div
						key={tab.id}
						className={`${
							activeTab === tab.id ? 'block' : 'hidden'
						} focus:outline-none`}
						role='tabpanel'
						aria-labelledby={`${tab.id}-tab`}
						tabIndex={0}>
						{tab.content}
					</div>
				))}
			</div>
		</div>
	);
}

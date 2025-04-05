export const EXPENSE_CATEGORIES = [
	'Housing',
	'Transportation',
	'Food',
	'Utilities',
	'Insurance',
	'Healthcare',
	'Debt',
	'Personal',
	'Entertainment',
	'Education',
	'Clothing',
	'Gifts/Donations',
	'Savings',
	'Travel',
	'Miscellaneous',
];

export const getCategoryColor = (
	category: string,
	isDarkMode?: boolean
): string => {
	const colorMap: Record<string, { light: string; dark: string }> = {
		Housing: {
			light: 'bg-red-100 text-red-800',
			dark: 'bg-red-900/70 text-red-200',
		},
		Transportation: {
			light: 'bg-blue-100 text-blue-800',
			dark: 'bg-blue-900/70 text-blue-200',
		},
		Food: {
			light: 'bg-green-100 text-green-800',
			dark: 'bg-green-900/70 text-green-200',
		},
		Utilities: {
			light: 'bg-yellow-100 text-yellow-800',
			dark: 'bg-yellow-900/70 text-yellow-200',
		},
		Insurance: {
			light: 'bg-purple-100 text-purple-800',
			dark: 'bg-purple-900/70 text-purple-200',
		},
		Healthcare: {
			light: 'bg-pink-100 text-pink-800',
			dark: 'bg-pink-900/70 text-pink-200',
		},
		Debt: {
			light: 'bg-orange-100 text-orange-800',
			dark: 'bg-orange-900/70 text-orange-200',
		},
		Personal: {
			light: 'bg-teal-100 text-teal-800',
			dark: 'bg-teal-900/70 text-teal-200',
		},
		Entertainment: {
			light: 'bg-indigo-100 text-indigo-800',
			dark: 'bg-indigo-900/70 text-indigo-200',
		},
		Education: {
			light: 'bg-cyan-100 text-cyan-800',
			dark: 'bg-cyan-900/70 text-cyan-200',
		},
		Clothing: {
			light: 'bg-lime-100 text-lime-800',
			dark: 'bg-lime-900/70 text-lime-200',
		},
		'Gifts/Donations': {
			light: 'bg-rose-100 text-rose-800',
			dark: 'bg-rose-900/70 text-rose-200',
		},
		Savings: {
			light: 'bg-emerald-100 text-emerald-800',
			dark: 'bg-emerald-900/70 text-emerald-200',
		},
		Travel: {
			light: 'bg-violet-100 text-violet-800',
			dark: 'bg-violet-900/70 text-violet-200',
		},
		Miscellaneous: {
			light: 'bg-gray-100 text-gray-800',
			dark: 'bg-gray-700 text-gray-200',
		},
	};

	// Check if isDarkMode was provided, otherwise try to detect it
	const darkMode =
		isDarkMode !== undefined
			? isDarkMode
			: typeof window !== 'undefined' &&
			  document.documentElement.classList.contains('dark');

	// Get the appropriate color based on mode
	const colorSet = colorMap[category] || colorMap['Miscellaneous'];
	return darkMode ? colorSet.dark : colorSet.light;
};

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
			dark: 'bg-red-900/30 text-red-300',
		},
		Transportation: {
			light: 'bg-blue-100 text-blue-800',
			dark: 'bg-blue-900/30 text-blue-300',
		},
		Food: {
			light: 'bg-green-100 text-green-800',
			dark: 'bg-green-900/30 text-green-300',
		},
		Utilities: {
			light: 'bg-yellow-100 text-yellow-800',
			dark: 'bg-yellow-900/30 text-yellow-300',
		},
		Insurance: {
			light: 'bg-purple-100 text-purple-800',
			dark: 'bg-purple-900/30 text-purple-300',
		},
		Healthcare: {
			light: 'bg-pink-100 text-pink-800',
			dark: 'bg-pink-900/30 text-pink-300',
		},
		Debt: {
			light: 'bg-orange-100 text-orange-800',
			dark: 'bg-orange-900/30 text-orange-300',
		},
		Personal: {
			light: 'bg-teal-100 text-teal-800',
			dark: 'bg-teal-900/30 text-teal-300',
		},
		Entertainment: {
			light: 'bg-indigo-100 text-indigo-800',
			dark: 'bg-indigo-900/30 text-indigo-300',
		},
		Education: {
			light: 'bg-cyan-100 text-cyan-800',
			dark: 'bg-cyan-900/30 text-cyan-300',
		},
		Clothing: {
			light: 'bg-lime-100 text-lime-800',
			dark: 'bg-lime-900/30 text-lime-300',
		},
		'Gifts/Donations': {
			light: 'bg-rose-100 text-rose-800',
			dark: 'bg-rose-900/30 text-rose-300',
		},
		Savings: {
			light: 'bg-emerald-100 text-emerald-800',
			dark: 'bg-emerald-900/30 text-emerald-300',
		},
		Travel: {
			light: 'bg-violet-100 text-violet-800',
			dark: 'bg-violet-900/30 text-violet-300',
		},
		Miscellaneous: {
			light: 'bg-gray-100 text-gray-800',
			dark: 'bg-gray-700 text-gray-300',
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

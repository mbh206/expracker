module.exports = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	darkMode: 'class', // This enables dark mode via class
	theme: {
		extend: {
			colors: {
				// Custom colors that work well in both light and dark modes
				primary: {
					50: '#e6f1fe',
					100: '#cce3fd',
					200: '#99c8fb',
					300: '#66acf9',
					400: '#3391f7',
					500: '#0075f5',
					600: '#005ec4',
					700: '#004693',
					800: '#002f62',
					900: '#001731',
				},
				// You can add more custom colors here
			},
		},
	},
	plugins: [],
};

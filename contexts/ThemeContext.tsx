// contexts/ThemeContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
}

// Create context with a default value
const ThemeContext = createContext<ThemeContextType>({
	theme: 'light',
	toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme>('light');
	const [mounted, setMounted] = useState(false);

	// On mount, read the theme from localStorage or system preference
	useEffect(() => {
		setMounted(true);

		// Check for saved theme in localStorage
		const savedTheme = localStorage.getItem('theme') as Theme | null;

		// Check for system preference
		const prefersDark =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-color-scheme: dark)').matches;

		// Set initial theme
		if (savedTheme) {
			setTheme(savedTheme);
		} else if (prefersDark) {
			setTheme('dark');
		}
	}, []);

	// Apply theme to document when it changes
	useEffect(() => {
		if (!mounted) return;

		const root = window.document.documentElement;

		if (theme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}

		localStorage.setItem('theme', theme);
	}, [theme, mounted]);

	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}

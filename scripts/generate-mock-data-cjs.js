// CommonJS version of the mock data generator
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const {
	add,
	format,
	startOfMonth,
	endOfMonth,
	startOfDay,
	subDays,
	subMonths,
} = require('date-fns');

const prisma = new PrismaClient();

// Configuration
const NUM_USERS = 3;
const MONTHS_OF_DATA = 6;
const EXPENSE_CATEGORIES = [
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

// User data
const USERS = [
	{ name: 'John Smith', email: 'john@example.com', password: 'password123' },
	{ name: 'Jane Doe', email: 'jane@example.com', password: 'password123' },
	{ name: 'Alex Johnson', email: 'alex@example.com', password: 'password123' },
];

// Recurring expense patterns
const RECURRING_EXPENSES = [
	{
		description: 'Rent',
		category: 'Housing',
		minAmount: 1200,
		maxAmount: 1200,
		frequency: 'monthly',
	},
	{
		description: 'Car Payment',
		category: 'Transportation',
		minAmount: 350,
		maxAmount: 350,
		frequency: 'monthly',
	},
	{
		description: 'Netflix',
		category: 'Entertainment',
		minAmount: 15.99,
		maxAmount: 15.99,
		frequency: 'monthly',
	},
	{
		description: 'Spotify',
		category: 'Entertainment',
		minAmount: 9.99,
		maxAmount: 9.99,
		frequency: 'monthly',
	},
	{
		description: 'Electricity',
		category: 'Utilities',
		minAmount: 80,
		maxAmount: 200,
		frequency: 'monthly',
	},
	{
		description: 'Water Bill',
		category: 'Utilities',
		minAmount: 40,
		maxAmount: 90,
		frequency: 'monthly',
	},
	{
		description: 'Phone Bill',
		category: 'Utilities',
		minAmount: 60,
		maxAmount: 80,
		frequency: 'monthly',
	},
	{
		description: 'Internet',
		category: 'Utilities',
		minAmount: 60,
		maxAmount: 60,
		frequency: 'monthly',
	},
	{
		description: 'Gym Membership',
		category: 'Personal',
		minAmount: 50,
		maxAmount: 50,
		frequency: 'monthly',
	},
	{
		description: 'Health Insurance',
		category: 'Insurance',
		minAmount: 300,
		maxAmount: 300,
		frequency: 'monthly',
	},
];

// Variable expense patterns
const VARIABLE_EXPENSES = [
	{
		description: 'Groceries',
		category: 'Food',
		minAmount: 50,
		maxAmount: 150,
		frequency: 'weekly',
	},
	{
		description: 'Restaurant',
		category: 'Food',
		minAmount: 20,
		maxAmount: 80,
		frequency: 'weekly',
	},
	{
		description: 'Lunch',
		category: 'Food',
		minAmount: 8,
		maxAmount: 20,
		frequency: 'weekday',
	},
	{
		description: 'Gas',
		category: 'Transportation',
		minAmount: 30,
		maxAmount: 60,
		frequency: 'biweekly',
	},
	{
		description: 'Shopping',
		category: 'Clothing',
		minAmount: 50,
		maxAmount: 200,
		frequency: 'monthly',
	},
	{
		description: 'Coffee',
		category: 'Food',
		minAmount: 3,
		maxAmount: 5,
		frequency: 'weekday',
	},
	{
		description: 'Entertainment',
		category: 'Entertainment',
		minAmount: 25,
		maxAmount: 100,
		frequency: 'biweekly',
	},
	{
		description: 'Pharmacy',
		category: 'Healthcare',
		minAmount: 15,
		maxAmount: 60,
		frequency: 'monthly',
	},
	{
		description: 'Haircut',
		category: 'Personal',
		minAmount: 25,
		maxAmount: 80,
		frequency: 'monthly',
	},
];

// Occasional expense patterns
const OCCASIONAL_EXPENSES = [
	{
		description: 'Car Repair',
		category: 'Transportation',
		minAmount: 200,
		maxAmount: 800,
		chance: 0.1,
	},
	{
		description: 'Doctor Visit',
		category: 'Healthcare',
		minAmount: 100,
		maxAmount: 300,
		chance: 0.15,
	},
	{
		description: 'Gift',
		category: 'Gifts/Donations',
		minAmount: 25,
		maxAmount: 100,
		chance: 0.2,
	},
	{
		description: 'Electronics',
		category: 'Personal',
		minAmount: 100,
		maxAmount: 1000,
		chance: 0.05,
	},
	{
		description: 'Vacation',
		category: 'Travel',
		minAmount: 500,
		maxAmount: 2000,
		chance: 0.03,
	},
	{
		description: 'Home Repair',
		category: 'Housing',
		minAmount: 100,
		maxAmount: 500,
		chance: 0.08,
	},
	{
		description: 'Charity',
		category: 'Gifts/Donations',
		minAmount: 20,
		maxAmount: 100,
		chance: 0.1,
	},
	{
		description: 'Books',
		category: 'Education',
		minAmount: 15,
		maxAmount: 50,
		chance: 0.15,
	},
	{
		description: 'Concert Tickets',
		category: 'Entertainment',
		minAmount: 50,
		maxAmount: 200,
		chance: 0.07,
	},
	{
		description: 'Subscription',
		category: 'Miscellaneous',
		minAmount: 10,
		maxAmount: 30,
		chance: 0.1,
	},
];

// Restaurant patterns for the lunch example
const RESTAURANTS = [
	{
		name: "Joe's Pizza",
		weekdayPrices: {
			Mon: [13, 18],
			Tue: [8, 12],
			Wed: [8, 12],
			Thu: [8, 12],
			Fri: [13, 18],
		},
	},
	{
		name: 'Green Salad Bar',
		weekdayPrices: {
			Mon: [10, 15],
			Tue: [10, 15],
			Wed: [8, 12],
			Thu: [10, 15],
			Fri: [10, 15],
		},
	},
	{
		name: 'Sushi Express',
		weekdayPrices: {
			Mon: [15, 25],
			Tue: [15, 25],
			Wed: [15, 25],
			Thu: [15, 25],
			Fri: [20, 30],
		},
	},
	{
		name: 'Burger Joint',
		weekdayPrices: {
			Mon: [12, 18],
			Tue: [12, 18],
			Wed: [12, 18],
			Thu: [12, 18],
			Fri: [12, 18],
		},
	},
	{
		name: 'Taco Truck',
		weekdayPrices: {
			Mon: [8, 12],
			Tue: [8, 12],
			Wed: [8, 12],
			Thu: [5, 8],
			Fri: [8, 12],
		},
	},
];

// Helper functions
function randomBetween(min, max) {
	return Math.random() * (max - min) + min;
}

function roundToDecimal(num, decimals = 2) {
	const factor = Math.pow(10, decimals);
	return Math.round(num * factor) / factor;
}

function getDayOfWeek(date) {
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return days[date.getDay()];
}

function isWeekday(date) {
	const day = date.getDay();
	return day > 0 && day < 6; // 0 is Sunday, 6 is Saturday
}

// Generate expenses for a user
async function generateExpensesForUser(userId) {
	const endDate = new Date();
	const startDate = subMonths(endDate, MONTHS_OF_DATA);
	const currentDate = startDate;

	// Track dates for recurring expenses to avoid duplicates
	const recurringExpenseDates = {};

	// Generate a favorite restaurant for weekday lunches
	const favoriteRestaurants = RESTAURANTS.slice(0, 2);

	while (currentDate <= endDate) {
		const currentDay = startOfDay(currentDate);
		const dayOfWeek = getDayOfWeek(currentDay);

		// Monthly recurring expenses
		if (
			currentDay.getDate() === 1 ||
			Object.keys(recurringExpenseDates).length === 0
		) {
			for (const expense of RECURRING_EXPENSES) {
				if (expense.frequency === 'monthly') {
					// Add some variance to the date (1-5 days)
					const expenseDate = add(currentDay, {
						days: Math.floor(Math.random() * 5),
					});
					const amount = roundToDecimal(
						randomBetween(expense.minAmount, expense.maxAmount)
					);

					await prisma.expense.create({
						data: {
							user: {
								connect: {
									id: userId,
								},
							},
							description: expense.description,
							amount,
							date: expenseDate,
							category: expense.category,
						},
					});

					recurringExpenseDates[expense.description] = expenseDate;
				}
			}
		}

		// Weekly expenses
		if (
			currentDay.getDay() === 1 ||
			isFirstDayOfPeriod(currentDay, startDate)
		) {
			// Monday or first day
			for (const expense of VARIABLE_EXPENSES) {
				if (expense.frequency === 'weekly') {
					const expenseDate = add(currentDay, {
						days: Math.floor(Math.random() * 7),
					});
					const amount = roundToDecimal(
						randomBetween(expense.minAmount, expense.maxAmount)
					);

					await prisma.expense.create({
						data: {
							user: {
								connect: {
									id: userId,
								},
							},
							description: expense.description,
							amount,
							date: expenseDate,
							category: expense.category,
						},
					});
				}
			}
		}

		// Biweekly expenses
		if (
			currentDay.getDate() === 1 ||
			currentDay.getDate() === 15 ||
			isFirstDayOfPeriod(currentDay, startDate)
		) {
			for (const expense of VARIABLE_EXPENSES) {
				if (expense.frequency === 'biweekly') {
					const expenseDate = add(currentDay, {
						days: Math.floor(Math.random() * 3),
					});
					const amount = roundToDecimal(
						randomBetween(expense.minAmount, expense.maxAmount)
					);

					await prisma.expense.create({
						data: {
							user: {
								connect: {
									id: userId,
								},
							},
							description: expense.description,
							amount,
							date: expenseDate,
							category: expense.category,
						},
					});
				}
			}
		}

		// Weekday expenses
		if (isWeekday(currentDay)) {
			for (const expense of VARIABLE_EXPENSES) {
				if (expense.frequency === 'weekday') {
					// Skip some days randomly (people don't buy coffee/lunch every day)
					if (Math.random() > 0.7) continue;

					if (expense.description === 'Lunch') {
						// Use the restaurant pattern
						const selectedRestaurant =
							favoriteRestaurants[
								Math.floor(Math.random() * favoriteRestaurants.length)
							];
						const priceRange = selectedRestaurant.weekdayPrices[dayOfWeek];
						const amount = roundToDecimal(
							randomBetween(priceRange[0], priceRange[1])
						);

						await prisma.expense.create({
							data: {
								user: {
									connect: {
										id: userId,
									},
								},
								description: `Lunch at ${selectedRestaurant.name}`,
								amount,
								date: currentDay,
								category: expense.category,
							},
						});
					} else {
						const amount = roundToDecimal(
							randomBetween(expense.minAmount, expense.maxAmount)
						);

						await prisma.expense.create({
							data: {
								user: {
									connect: {
										id: userId,
									},
								},
								description: expense.description,
								amount,
								date: currentDay,
								category: expense.category,
							},
						});
					}
				}
			}
		}

		// Occasional expenses
		for (const expense of OCCASIONAL_EXPENSES) {
			if (Math.random() < expense.chance / 30) {
				// Adjust probability for daily check
				const amount = roundToDecimal(
					randomBetween(expense.minAmount, expense.maxAmount)
				);

				await prisma.expense.create({
					data: {
						user: {
							connect: {
								id: userId,
							},
						},
						description: expense.description,
						amount,
						date: currentDay,
						category: expense.category,
					},
				});
			}
		}

		// Move to the next day
		currentDate.setDate(currentDate.getDate() + 1);
	}
}

function isFirstDayOfPeriod(date, startDate) {
	// Check if this is the first day we're processing
	return date.getTime() === startDate.getTime();
}

// Create a household with members
async function createHousehold(name, members) {
	// Create the household
	const household = await prisma.household.create({
		data: {
			name,
			members: {
				create: members.map((userId, index) => ({
					userId,
					role: index === 0 ? 'admin' : 'member', // First user is admin
				})),
			},
		},
	});

	return household;
}

// Create shared expenses for a household
async function createSharedExpenses(householdId, members) {
	const sharedExpenses = [
		{
			description: 'Grocery Shopping',
			category: 'Food',
			minAmount: 100,
			maxAmount: 300,
			frequency: 'weekly',
		},
		{
			description: 'Dinner Out',
			category: 'Food',
			minAmount: 50,
			maxAmount: 150,
			frequency: 'biweekly',
		},
		{
			description: 'Utilities',
			category: 'Utilities',
			minAmount: 100,
			maxAmount: 250,
			frequency: 'monthly',
		},
		{
			description: 'Home Supplies',
			category: 'Miscellaneous',
			minAmount: 30,
			maxAmount: 100,
			frequency: 'biweekly',
		},
		{
			description: 'Internet Bill',
			category: 'Utilities',
			minAmount: 50,
			maxAmount: 80,
			frequency: 'monthly',
		},
	];

	const endDate = new Date();
	const startDate = subMonths(endDate, MONTHS_OF_DATA);
	const currentDate = startDate;

	while (currentDate <= endDate) {
		const currentDay = startOfDay(currentDate);

		// Monthly expenses
		if (
			currentDay.getDate() === 1 ||
			isFirstDayOfPeriod(currentDay, startDate)
		) {
			for (const expense of sharedExpenses) {
				if (expense.frequency === 'monthly') {
					// Pick a random member to be the payer
					const payerId = members[Math.floor(Math.random() * members.length)];
					const expenseDate = add(currentDay, {
						days: Math.floor(Math.random() * 5),
					});
					const amount = roundToDecimal(
						randomBetween(expense.minAmount, expense.maxAmount)
					);

					await prisma.expense.create({
						data: {
							user: {
								connect: {
									id: payerId,
								},
							},
							household: {
								connect: {
									id: householdId,
								},
							},
							description: expense.description,
							amount,
							date: expenseDate,
							category: expense.category,
						},
					});
				}
			}
		}

		// Weekly expenses
		if (
			currentDay.getDay() === 6 ||
			isFirstDayOfPeriod(currentDay, startDate)
		) {
			// Saturday or first day
			for (const expense of sharedExpenses) {
				if (expense.frequency === 'weekly') {
					// Pick a random member to be the payer
					const payerId = members[Math.floor(Math.random() * members.length)];
					const expenseDate = add(currentDay, {
						days: Math.floor(Math.random() * 2),
					});
					const amount = roundToDecimal(
						randomBetween(expense.minAmount, expense.maxAmount)
					);

					await prisma.expense.create({
						data: {
							user: {
								connect: {
									id: payerId,
								},
							},
							household: {
								connect: {
									id: householdId,
								},
							},
							description: expense.description,
							amount,
							date: expenseDate,
							category: expense.category,
						},
					});
				}
			}
		}

		// Biweekly expenses
		if (
			currentDay.getDate() === 10 ||
			currentDay.getDate() === 25 ||
			isFirstDayOfPeriod(currentDay, startDate)
		) {
			for (const expense of sharedExpenses) {
				if (expense.frequency === 'biweekly') {
					// Pick a random member to be the payer
					const payerId = members[Math.floor(Math.random() * members.length)];
					const expenseDate = add(currentDay, {
						days: Math.floor(Math.random() * 3),
					});
					const amount = roundToDecimal(
						randomBetween(expense.minAmount, expense.maxAmount)
					);

					await prisma.expense.create({
						data: {
							user: {
								connect: {
									id: payerId,
								},
							},
							household: {
								connect: {
									id: householdId,
								},
							},
							description: expense.description,
							amount,
							date: expenseDate,
							category: expense.category,
						},
					});
				}
			}
		}

		// Move to the next day
		currentDate.setDate(currentDate.getDate() + 1);
	}
}

// Main function to generate all data
async function generateMockData() {
	try {
		console.log('Starting to generate mock data...');

		// Clear existing data
		console.log('Clearing existing data...');
		await prisma.expense.deleteMany({});
		await prisma.householdMember.deleteMany({});
		await prisma.household.deleteMany({});
		await prisma.user.deleteMany({});

		console.log('Creating users...');
		const userIds = [];

		// Create users
		for (let i = 0; i < USERS.length; i++) {
			const userData = USERS[i];
			const hashedPassword = await bcrypt.hash(userData.password, 12);

			const user = await prisma.user.create({
				data: {
					name: userData.name,
					email: userData.email,
					password: hashedPassword,
				},
			});

			userIds.push(user.id);
			console.log(`Created user: ${user.name} (${user.id})`);
		}

		// Generate expenses for each user
		console.log('Generating expenses for users...');
		for (const userId of userIds) {
			await generateExpensesForUser(userId);
			console.log(`Generated expenses for user: ${userId}`);
		}

		// Create a household with all users
		console.log('Creating household...');
		const household = await createHousehold('Family Home', userIds);
		console.log(`Created household: ${household.name} (${household.id})`);

		// Generate shared expenses for the household
		console.log('Generating shared expenses for household...');
		await createSharedExpenses(household.id, userIds);
		console.log(`Generated shared expenses for household: ${household.id}`);

		console.log('Mock data generation completed successfully!');
	} catch (error) {
		console.error('Error generating mock data:', error);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
generateMockData();

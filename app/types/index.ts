import { Expense } from '@prisma/client';

export interface ExpenseWithRecurring extends Expense {
	isRecurring: boolean;
}

export interface HomeDashboardProps {
	expenses: ExpenseWithRecurring[];
	recurringExpenses: ExpenseWithRecurring[];
	upcomingBills: ExpenseWithRecurring[];
	recommendations: string[];
}

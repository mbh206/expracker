import { format } from 'date-fns';

// Generate fallback advice when the LLM service fails
export function generateFallbackAdvice(
	expense: any,
	categoryData: any,
	similarExpenses: any[]
): string[] {
	const insights: string[] = [];

	// Basic expense info
	const expenseDate = new Date(expense.date);
	const expenseCategory = expense.category;
	const expenseAmount = expense.amount;
	const expenseDescription = expense.description;

	// Get category average
	const categoryAverage = categoryData?.average || 0;
	const categoryCount = categoryData?.count || 0;

	// Compare with category average
	if (categoryCount > 0) {
		const percentDiff =
			((expenseAmount - categoryAverage) / categoryAverage) * 100;

		if (Math.abs(percentDiff) < 10) {
			insights.push(
				`This ${expenseCategory} expense is close to your average spending in this category (${categoryAverage.toFixed(
					2
				)}).`
			);
		} else if (percentDiff > 0) {
			insights.push(
				`This ${expenseCategory} expense is ${Math.abs(
					Math.round(percentDiff)
				)}% higher than your average spending in this category (${categoryAverage.toFixed(
					2
				)}).`
			);
		} else {
			insights.push(
				`This ${expenseCategory} expense is ${Math.abs(
					Math.round(percentDiff)
				)}% lower than your average spending in this category (${categoryAverage.toFixed(
					2
				)}).`
			);
		}
	} else {
		insights.push(
			`This is your first recorded expense in the ${expenseCategory} category.`
		);
	}

	// Check for similar expenses
	if (similarExpenses.length > 0) {
		const similarAverage =
			similarExpenses.reduce((sum, exp) => sum + exp.amount, 0) /
			similarExpenses.length;
		const percentDiff =
			((expenseAmount - similarAverage) / similarAverage) * 100;

		if (Math.abs(percentDiff) < 10) {
			insights.push(
				`Your spending at ${expenseDescription} is consistent with your previous visits.`
			);
		} else if (percentDiff > 0) {
			insights.push(
				`You spent ${Math.abs(
					Math.round(percentDiff)
				)}% more than usual at ${expenseDescription} this time.`
			);
		} else {
			insights.push(
				`You spent ${Math.abs(
					Math.round(percentDiff)
				)}% less than usual at ${expenseDescription} this time.`
			);
		}
	}

	// Generic monthly budget impact
	insights.push(
		`Keep tracking your expenses to get more personalized insights about your spending patterns.`
	);

	return insights;
}

// Generate fallback answers to user questions
export function generateFallbackAnswer(
	question: string,
	expense: any,
	categoryData: any,
	similarExpenses: any[]
): string {
	const normalizedQuestion = question.toLowerCase();
	const expenseCategory = expense.category;
	const expenseAmount = expense.amount;
	const expenseDescription = expense.description;
	const expenseDate = new Date(expense.date);

	// Compare with average
	if (
		normalizedQuestion.includes('compare') ||
		normalizedQuestion.includes('average')
	) {
		if (categoryData.count > 0) {
			return `This ${expenseCategory} expense of $${expenseAmount.toFixed(
				2
			)} compares to your average of $${categoryData.average.toFixed(
				2
			)} for this category, based on ${categoryData.count} similar expenses.`;
		} else {
			return `This is your first ${expenseCategory} expense, so I don't have enough data to make comparisons yet.`;
		}
	}

	// Monthly budget
	if (
		normalizedQuestion.includes('budget') ||
		normalizedQuestion.includes('month')
	) {
		return `This ${expenseCategory} expense represents part of your monthly spending. Continue tracking your expenses to get insights on your monthly budget impact.`;
	}

	// Patterns or trends
	if (
		normalizedQuestion.includes('pattern') ||
		normalizedQuestion.includes('trend')
	) {
		if (similarExpenses.length >= 3) {
			return `You've had ${similarExpenses.length} similar expenses to this ${expenseDescription} purchase. Your spending has been relatively consistent in this area.`;
		} else {
			return `I don't have enough data yet to identify patterns in your ${expenseDescription} expenses.`;
		}
	}

	// Savings tips
	if (
		normalizedQuestion.includes('save') ||
		normalizedQuestion.includes('reduce')
	) {
		return `To save money on ${expenseCategory} expenses like this one, consider setting a budget, looking for discounts, or comparing prices before purchasing.`;
	}

	// Default response
	return `This is a ${expenseCategory} expense of $${expenseAmount.toFixed(
		2
	)} on ${format(
		expenseDate,
		'MMMM d, yyyy'
	)}. Continue tracking your expenses to get more detailed insights.`;
}

import React from 'react';
import { Expense } from '../types';
import * as Icons from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { LucideProps } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseClick?: (expense: Expense) => void;
}

export default function ExpenseList({ expenses, onExpenseClick }: ExpenseListProps) {
  // Sort expenses by created_at first, then group by date
  const sortedAndGroupedExpenses = expenses
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .reduce((groups, expense) => {
      const date = format(new Date(expense.date), 'EEEE, d');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
      return groups;
    }, {} as Record<string, Expense[]>);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No expenses found. Add your first expense using the + button below.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(sortedAndGroupedExpenses).map(([date, dateExpenses]) => (
        <div key={date} className="border-b pb-4">
          <p className="text-gray-600 mb-2">{date}</p>
          <div className="space-y-3">
            {dateExpenses
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((expense) => {
                const IconComponent = expense.category?.icon ? 
                  (Icons[expense.category.icon as keyof typeof Icons] as React.FC<LucideProps>) : 
                  null;
                
                return (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => onExpenseClick?.(expense)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${expense.category?.color}20` }}>
                        {IconComponent && (
                          <IconComponent
                            className="h-5 w-5"
                            style={{ color: expense.category?.color }}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{expense.category?.name}</p>
                        {expense.tag && (
                          <p className="text-sm text-gray-500">{expense.tag}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-red-500">-${expense.amount.toFixed(2)}</p>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { 
  Home, 
  BarChart2, 
  PlusCircle, 
  Bell, 
  User as UserIcon,
  Search,
  Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { Category, Expense, WeeklyLimit } from '../types';
import ExpenseList from './ExpenseList';
import AddExpenseModal from './AddExpenseModal';
import AddCategoryModal from './AddCategoryModal';
import { User } from '@supabase/supabase-js';
import ExpensesModal from './ExpensesModal';

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [weeklyLimit, setWeeklyLimit] = useState<WeeklyLimit | null>(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [totalExpense, setTotalExpense] = useState(0);
  const [lastMonthDiff, setLastMonthDiff] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetchUserData();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*');
      
      if (categoriesData) setCategories(categoriesData);

      // Fetch weekly limit
      const { data: limitData } = await supabase
        .from('weekly_limits')
        .select('*')
        .single();
      
      if (limitData) setWeeklyLimit(limitData);

      // Fetch recent expenses for the dashboard view (limit 6)
      const { data: recentExpenses } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (recentExpenses) {
        setExpenses(recentExpenses);
      }

      // Fetch all expenses for calculations and ExpensesModal
      const { data: allExpensesData } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false });
      
      if (allExpensesData) {
        setAllExpenses(allExpensesData);
        
        // Calculate total
        const total = allExpensesData.reduce((sum, expense) => sum + Number(expense.amount), 0);
        setTotalExpense(total);

        // Calculate weekly data and last month difference
        const weeklyExpenses = calculateWeeklyExpenses(allExpensesData);
        setWeeklyData(weeklyExpenses);

        const lastMonthTotal = calculateLastMonthTotal(allExpensesData);
        setLastMonthDiff(total - lastMonthTotal);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateWeeklyExpenses = (expensesData: Expense[]) => {
    const weeks: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));
      const weekKey = `W${i + 1}`;
      weeks[weekKey] = 0;
    }

    expensesData.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const weekDiff = Math.floor((today.getTime() - expenseDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (weekDiff < 5) {
        const weekKey = `W${weekDiff + 1}`;
        weeks[weekKey] += Number(expense.amount);
      }
    });

    return Object.entries(weeks).map(([week, amount]) => ({
      week,
      amount: Math.round(amount),
    })).reverse();
  };

  const calculateLastMonthTotal = (expensesData: Expense[]) => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    return expensesData
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= lastMonth && expenseDate <= lastMonthEnd;
      })
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="flex justify-between items-center mb-8 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm font-medium tracking-wider uppercase">Welcome back</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                {user?.email?.split('@')[0] || 'User'}
              </h1>
              <span className="text-gray-500 text-sm mt-1">Track your expenses with ease</span>
            </div>
          </div>
          <div className="mt-4 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="bg-indigo-500 text-white p-6 rounded-xl mb-6">
              <h3 className="text-lg mb-2">Expense total</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">${totalExpense.toFixed(2)}</p>
                  <p className="text-sm opacity-80">
                    {lastMonthDiff >= 0 ? '+' : '-'}${Math.abs(lastMonthDiff).toFixed(2)} than last month
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Recent Expenses</h3>
                <button
                  onClick={() => setIsExpensesModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  See All
                </button>
              </div>
              <ExpenseList expenses={expenses} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Expense Breakdown</h3>
              <p className="text-gray-600">Limit ${weeklyLimit?.amount.toFixed(2)} / week</p>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Bar dataKey="amount" fill="#818cf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Spending Details</h3>
                <button
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </button>
              </div>
              <p className="text-gray-600 mb-4">Your expenses are divided into {categories.length} categories</p>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No categories yet. Add your first category to start tracking expenses.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((category) => {
                    const categoryTotal = expenses
                      .filter((e) => e.category_id === category.id)
                      .reduce((sum, e) => sum + e.amount, 0);
                    
                    return (
                      <div
                        key={category.id}
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: `${category.color}10` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm">${categoryTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 w-full bg-white border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Home className="nav-icon" />
            <BarChart2 className="nav-icon" />
            <div className="relative -top-8">
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="bg-pink-500 p-4 rounded-full text-white shadow-lg hover:bg-pink-600 transition-colors"
                disabled={categories.length === 0}
                title={categories.length === 0 ? "Add a category first" : "Add expense"}
              >
                <PlusCircle className="h-6 w-6" />
              </button>
            </div>
            <Bell className="nav-icon" />
            <UserIcon className="nav-icon" />
          </div>
        </div>
      </nav>

      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        categories={categories}
        onExpenseAdded={fetchData}
      />

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onCategoryAdded={fetchData}
      />

      <ExpensesModal
        isOpen={isExpensesModalOpen}
        onClose={() => setIsExpensesModalOpen(false)}
        expenses={allExpenses}
        categories={categories}
      />
    </div>
  );
}
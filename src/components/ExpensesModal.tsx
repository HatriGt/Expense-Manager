import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowUpDown, Calendar, Filter, Check, Search } from 'lucide-react';
import { Category, Expense } from '../types';
import * as Icons from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, Switch } from '@headlessui/react';
import { supabase } from '../lib/supabase';
import { LucideProps } from 'lucide-react';
import EditExpenseModal from './EditExpenseModal';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  expenses: Expense[];
}

type SortType = 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function CenterModal({ isOpen, onClose, title, children }: BottomSheetProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50 md:hidden"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">{title}</Dialog.Title>
            <button 
              onClick={onClose} 
              className="p-2"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Add this interface to define the structure of expenses from the materialized view
interface ExpenseWithCategory extends Omit<Expense, 'category'> {
  category_name: string;
  category_id: string;
  category_icon: string;
  category_color: string;
}

// Add this interface after the existing interfaces
interface SearchTag {
  id: string;
  text: string;
}

export default function ExpensesModal({ isOpen, onClose, categories, expenses }: ExpensesModalProps) {
  const getCurrentMonthRange = () => {
    const today = new Date();
    const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const end = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return {
      start,
      end
    };
  };

  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseWithCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [dateRange, setDateRange] = useState(getCurrentMonthRange());
  const [searchTerms, setSearchTerms] = useState<SearchTag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchTerms([]);
      setInputValue('');
      setIsSearching(false);
      
      setSelectedCategories([]);
      setDateRange(getCurrentMonthRange());
      setSortBy('date');
      setSortOrder('desc');
      setIsCategorySheetOpen(false);
      setIsDateSheetOpen(false);
      setIsSortSheetOpen(false);
    }
  }, [isOpen]);

  const fetchFilteredExpenses = useCallback(async (searchConditions?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      let query = supabase
        .from('expenses_with_categories')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories);
      }

      if (searchConditions) {
        query = query.or(searchConditions);
      }

      if (sortBy === 'date') {
        query = query.order('date', { ascending: sortOrder === 'asc' }).order('created_at', { ascending: false });
      } else {
        query = query.order('amount', { ascending: sortOrder === 'asc' }).order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setFilteredExpenses(data || []);
    } catch (error) {
      console.error('Error fetching filtered expenses:', error);
    }
  }, [dateRange, selectedCategories, sortBy, sortOrder]);

  useEffect(() => {
    if (isOpen) {
      fetchFilteredExpenses();
    }
  }, [isOpen, fetchFilteredExpenses]);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const groupExpensesByDate = (expenses: ExpenseWithCategory[]) => {
    return expenses.reduce((groups, expense) => {
      const date = format(new Date(expense.date), 'EEEE, d');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
      return groups;
    }, {} as Record<string, ExpenseWithCategory[]>);
  };

  if (!isOpen) return null;

  const groupedExpenses = groupExpensesByDate(filteredExpenses);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      addSearchTerm(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && searchTerms.length > 0) {
      removeSearchTerm(searchTerms[searchTerms.length - 1].id);
    }
  };

  const addSearchTerm = (term: string) => {
    const trimmedTerm = term.trim();
    if (trimmedTerm && !searchTerms.some(t => t.text.toLowerCase() === trimmedTerm.toLowerCase())) {
      const newTerm = { id: crypto.randomUUID(), text: trimmedTerm };
      setSearchTerms(prev => [...prev, newTerm]);
      setInputValue('');
      // Trigger search immediately
      handleSearch([...searchTerms, newTerm]);
    }
  };

  const removeSearchTerm = (id: string) => {
    setSearchTerms(prev => {
      const newTerms = prev.filter(term => term.id !== id);
      // Trigger search immediately after removal
      handleSearch(newTerms);
      return newTerms;
    });
  };

  const handleSearch = (terms: SearchTag[]) => {
    setIsSearching(true);
    const searchConditions = terms.map(term => 
      `category_name.ilike.%${term.text}%,tag.ilike.%${term.text}%`
    ).join(',');
    
    // Update fetchFilteredExpenses with the new search terms
    fetchFilteredExpenses(searchConditions).finally(() => setIsSearching(false));
  };

  const handleExpenseClick = (expense: ExpenseWithCategory) => {
    // Convert ExpenseWithCategory to Expense format
    const fullExpense: Expense = {
      id: expense.id,
      amount: expense.amount,
      tag: expense.tag,
      category_id: expense.category_id,
      date: expense.date,
      created_at: expense.created_at,
      user_id: expense.user_id,
      category: {
        id: expense.category_id,
        name: expense.category_name,
        icon: expense.category_icon,
        color: expense.category_color,
        user_id: expense.user_id
      }
    };
    setSelectedExpense(fullExpense);
    setIsEditModalOpen(true);
  };

  const handleExpenseUpdate = () => {
    fetchFilteredExpenses();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col relative shadow-xl border border-gray-100">
          {/* Header */}
          <div className="p-6 border-b bg-white rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                  All Expenses
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-gray-500 text-sm">Total:</p>
                  <p className="text-lg font-semibold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                    ${totalExpenses.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="px-6 py-4 border-b bg-white sticky top-0 z-10 space-y-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="flex flex-wrap items-center gap-2 w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-transparent bg-white transition-colors">
                {searchTerms.map(term => (
                  <span
                    key={term.id}
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    {term.text}
                    <button
                      onClick={() => removeSearchTerm(term.id)}
                      className="hover:text-indigo-900 transition-colors ml-1"
                      aria-label="Remove search term"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={searchTerms.length === 0 ? "Search categories or tags..." : ""}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 outline-none min-w-[150px] bg-transparent placeholder-gray-400"
                />
              </div>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {isSearching ? (
                  <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setIsCategorySheetOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap text-sm group"
              >
                <Filter className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                  {selectedCategories[0] 
                    ? categories.find(c => c.id === selectedCategories[0])?.name 
                    : 'Category'}
                </span>
              </button>
              
              <button
                onClick={() => setIsDateSheetOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap text-sm group"
              >
                <Calendar className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                  {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d')}
                </span>
              </button>
              
              <button
                onClick={() => setIsSortSheetOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap text-sm group"
              >
                <ArrowUpDown className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                  {sortBy === 'date' ? 'Date' : 'Amount'} ({sortOrder === 'asc' ? '↑' : '↓'})
                </span>
              </button>
            </div>
          </div>

          {/* Expense List */}
          <div className="flex-1 overflow-auto bg-white">
            <div className="divide-y divide-gray-100">
              {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
                <div key={date} className="p-4 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-medium text-gray-500 mb-3 px-2">{date}</p>
                  <div className="space-y-2">
                    {(dateExpenses as ExpenseWithCategory[]).map((expense) => {
                      const IconComponent = expense.category_icon ? 
                        (Icons[expense.category_icon as keyof typeof Icons] as React.FC<LucideProps>) : 
                        null;
                      
                      return (
                        <div 
                          key={expense.id} 
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-white transition-colors cursor-pointer group"
                          onClick={() => handleExpenseClick(expense)}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-2.5 rounded-xl"
                              style={{ backgroundColor: `${expense.category_color}15` }}
                            >
                              {IconComponent && (
                                <IconComponent
                                  className="h-5 w-5"
                                  style={{ color: expense.category_color }}
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {expense.category_name}
                              </p>
                              {expense.tag && (
                                <p className="text-sm text-gray-500">
                                  {expense.tag}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-base font-semibold text-red-500">
                            -${expense.amount.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        categories={categories}
        onExpenseUpdated={handleExpenseUpdate}
      />

      <CenterModal
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        title="Select Category"
      >
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          <button
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg"
            onClick={() => {
              setSelectedCategories([]);
              setIsCategorySheetOpen(false);
            }}
          >
            <span>All Categories</span>
            {selectedCategories.length === 0 && <Check className="h-5 w-5 text-indigo-600" />}
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg"
              onClick={() => {
                setSelectedCategories([category.id]);
                setIsCategorySheetOpen(false);
              }}
            >
              <span>{category.name}</span>
              {selectedCategories.includes(category.id) && <Check className="h-5 w-5 text-indigo-600" />}
            </button>
          ))}
        </div>
      </CenterModal>

      <CenterModal
        isOpen={isDateSheetOpen}
        onClose={() => setIsDateSheetOpen(false)}
        title="Select Date Range"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, start: e.target.value }));
                if (dateRange.end) {
                  setIsDateSheetOpen(false);
                }
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              title="Start date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, end: e.target.value }));
                if (dateRange.start) {
                  setIsDateSheetOpen(false);
                }
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              title="End date"
            />
          </div>
        </div>
      </CenterModal>

      <CenterModal
        isOpen={isSortSheetOpen}
        onClose={() => setIsSortSheetOpen(false)}
        title="Sort By"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <button
              className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg ${
                sortBy === 'date' ? 'bg-gray-50' : ''
              }`}
              onClick={() => {
                setSortBy('date');
                setIsSortSheetOpen(false);
              }}
            >
              <span>Date</span>
              {sortBy === 'date' && <Check className="h-5 w-5 text-indigo-600" />}
            </button>
            <button
              className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 rounded-lg ${
                sortBy === 'amount' ? 'bg-gray-50' : ''
              }`}
              onClick={() => {
                setSortBy('amount');
                setIsSortSheetOpen(false);
              }}
            >
              <span>Amount</span>
              {sortBy === 'amount' && <Check className="h-5 w-5 text-indigo-600" />}
            </button>
          </div>

          <div className="border-t pt-4">
            <Switch.Group>
              <div className="flex items-center justify-between">
                <Switch.Label className="text-sm font-medium text-gray-700">
                  {sortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
                </Switch.Label>
                <Switch
                  checked={sortOrder === 'asc'}
                  onChange={(checked) => {
                    setSortOrder(checked ? 'asc' : 'desc');
                    setIsSortSheetOpen(false);
                  }}
                  className={`${
                    sortOrder === 'asc' ? 'bg-indigo-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                >
                  <span
                    className={`${
                      sortOrder === 'asc' ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {sortBy === 'date' 
                  ? (sortOrder === 'asc' ? 'Oldest First' : 'Latest First')
                  : (sortOrder === 'asc' ? 'Low to High' : 'High to Low')}
              </p>
            </Switch.Group>
          </div>
        </div>
      </CenterModal>
    </>
  );
} 
import React, { useState, useEffect, Fragment } from 'react';
import { X, ArrowUpDown, ChevronDown, Calendar, Filter, Check, Search } from 'lucide-react';
import { Category, Expense } from '../types';
import * as Icons from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, Switch } from '@headlessui/react';
import { supabase } from '../lib/supabase';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  categories: Category[];
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

export default function ExpensesModal({ isOpen, onClose, expenses, categories }: ExpensesModalProps) {
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);

  // Helper function to get current month's date range
  const getCurrentMonthRange = () => {
    const today = new Date();
    const monthStart = today.toISOString().slice(0, 7) + '-01';
    const endDay = today;
    
    return {
      start: monthStart,
      end: endDay.toISOString().split('T')[0]
    };
  };

  // Initialize date range with current month
  const [dateRange, setDateRange] = useState(getCurrentMonthRange());

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset category filter
      setSelectedCategories([]);
      
      // Reset date range to current month
      setDateRange(getCurrentMonthRange());
      
      // Reset sort to default (date, descending)
      setSortBy('date');
      setSortOrder('desc');
      setSearchTerms([]);

      // Close any open filter sheets/popups
      setIsCategorySheetOpen(false);
      setIsDateSheetOpen(false);
      setIsSortSheetOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchFilteredExpenses();
    }
  }, [isOpen, selectedCategories, dateRange, sortBy, sortOrder, searchTerms]);

  const fetchFilteredExpenses = async () => {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `);

      // Apply date range filter
      query = query
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      // Apply category filter
      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories);
      }

      // Apply search terms (if any)
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => {
          const searchTerm = `%${term.toLowerCase()}%`;
          return `(LOWER(tag) LIKE '${searchTerm}' OR EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = expenses.category_id 
            AND LOWER(categories.name) LIKE '${searchTerm}'
          ))`;
        }).join(' OR ');
        
        query = query.or(searchConditions);
      }

      // Apply sorting
      if (sortBy === 'date') {
        query = query.order('date', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('amount', { ascending: sortOrder === 'asc' });
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setFilteredExpenses(data || []);
    } catch (error) {
      console.error('Error fetching filtered expenses:', error);
    }
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const groupExpensesByDate = (expenses: Expense[]) => {
    return expenses.reduce((groups, expense) => {
      const date = format(new Date(expense.date), 'EEEE, d');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
      return groups;
    }, {} as Record<string, Expense[]>);
  };

  if (!isOpen) return null;

  const groupedExpenses = groupExpensesByDate(filteredExpenses);

  const MobileFilters = () => (
    <div className="flex gap-2 md:hidden">
      <button
        onClick={() => setIsCategorySheetOpen(true)}
        className="flex-1 px-3 py-2 border rounded-md text-sm flex items-center justify-center gap-2"
      >
        <Filter className="h-4 w-4" />
        {selectedCategories[0] 
          ? categories.find(c => c.id === selectedCategories[0])?.name 
          : 'Category'}
      </button>
      
      <button
        onClick={() => setIsDateSheetOpen(true)}
        className="flex-1 px-3 py-2 border rounded-md text-sm flex items-center justify-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d')}
      </button>
      
      <button
        onClick={() => setIsSortSheetOpen(true)}
        className="flex-1 px-3 py-2 border rounded-md text-sm flex items-center justify-center gap-2"
      >
        <ArrowUpDown className="h-4 w-4" />
        Sort
      </button>
    </div>
  );

  const DesktopFilters = () => (
    <div className="hidden md:flex items-center gap-2">
      {/* Existing Menu, Popover components for desktop */}
      {/* ... Your existing desktop filter components ... */}
    </div>
  );

  // Handle adding and removing search terms
  const handleSearchInput = (value: string) => {
    if (value.endsWith(' ')) {
      const term = value.trim();
      if (term && !searchTerms.includes(term)) {
        setSearchTerms([...searchTerms, term]);
      }
      return '';
    }
    return value;
  };

  const removeSearchTerm = (termToRemove: string) => {
    setSearchTerms(searchTerms.filter(term => term !== termToRemove));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl h-[90vh] flex flex-col relative">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">All Expenses</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mt-2">Total: ${totalExpenses.toFixed(2)}</p>
          </div>

          {/* Updated Search Box */}
          <div className="p-4 border-b bg-white sticky top-0 z-10">
            <div className="mb-4">
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                  {searchTerms.map((term, index) => (
                    <span 
                      key={index}
                      className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {term}
                      <button
                        onClick={() => removeSearchTerm(term)}
                        className="hover:text-indigo-600"
                        aria-label={`Remove ${term} from search`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 outline-none min-w-[100px]"
                    placeholder={searchTerms.length ? '' : 'Search in tags and categories...'}
                    onChange={(e) => {
                      const newValue = handleSearchInput(e.target.value);
                      e.target.value = newValue;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const term = e.currentTarget.value.trim();
                        if (!searchTerms.includes(term)) {
                          setSearchTerms([...searchTerms, term]);
                        }
                        e.currentTarget.value = '';
                      } else if (e.key === 'Backspace' && !e.currentTarget.value && searchTerms.length > 0) {
                        setSearchTerms(searchTerms.slice(0, -1));
                      }
                    }}
                  />
                </div>
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <MobileFilters />
            <DesktopFilters />
          </div>

          {/* Expense List */}
          <div className="flex-1 overflow-auto">
            <div className="divide-y">
              {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
                <div key={date} className="p-4">
                  <p className="text-sm text-gray-600 mb-2">{date}</p>
                  <div className="space-y-3">
                    {dateExpenses.map((expense) => {
                      const IconComponent = Icons[expense.category?.icon as keyof typeof Icons];
                      
                      return (
                        <div key={expense.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-2 rounded-lg" 
                              style={{ backgroundColor: `${expense.category?.color}20` }}
                            >
                              {IconComponent && (
                                <IconComponent
                                  className="h-4 w-4"
                                  style={{ color: expense.category?.color }}
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{expense.category?.name}</p>
                              {expense.tag && (
                                <p className="text-xs text-gray-500">{expense.tag}</p>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-medium text-red-500">
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

      {/* Replace BottomSheet with CenterModal */}
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
                // Close modal if both dates are selected
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
                // Close modal if both dates are selected
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
          {/* Sort Field Selection */}
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

          {/* Sort Order Switch */}
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
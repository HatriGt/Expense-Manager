import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Category, Expense } from '../types';
import { X, Check, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { DayPicker, CaptionProps, useNavigation } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  categories: Category[];
  onExpenseUpdated: () => void;
}

const dayPickerStyles = {
  button: {
    backgroundColor: 'transparent !important'
  },
  day_selected: {
    background: 'linear-gradient(to right, #6366f1, #ec4899) !important',
    color: 'white !important',
    fontWeight: '500 !important'
  },
  day_today: {
    color: '#6366f1 !important'
  }
};

function CustomCaption(props: CaptionProps) {
  const { displayMonth } = props;
  const { goToMonth } = useNavigation();
  const months = Array.from({ length: 12 }, (_, i) => new Date(displayMonth.getFullYear(), i, 1));
  const years = Array.from({ length: 10 }, (_, i) => displayMonth.getFullYear() - 5 + i);
  const [showMonthsList, setShowMonthsList] = useState(false);
  const [showYearsList, setShowYearsList] = useState(false);

  return (
    <div className="relative flex items-center justify-center gap-1">
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 font-medium"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowMonthsList(!showMonthsList);
          setShowYearsList(false);
        }}
      >
        {format(displayMonth, 'MMMM')}
        {showMonthsList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 font-medium"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowYearsList(!showYearsList);
          setShowMonthsList(false);
        }}
      >
        {displayMonth.getFullYear()}
        {showYearsList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showMonthsList && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-1 p-2">
            {months.map((month) => (
              <button
                type="button"
                key={month.getMonth()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (goToMonth) {
                    goToMonth(month);
                    setShowMonthsList(false);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-sm hover:bg-gray-100 ${
                  month.getMonth() === displayMonth.getMonth() 
                    ? 'bg-indigo-50 text-indigo-600 font-medium' 
                    : ''
                }`}
              >
                {format(month, 'MMM')}
              </button>
            ))}
          </div>
        </div>
      )}

      {showYearsList && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-1 p-2">
            {years.map((year) => (
              <button
                type="button"
                key={year}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (goToMonth) {
                    goToMonth(new Date(year, displayMonth.getMonth()));
                    setShowYearsList(false);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-sm hover:bg-gray-100 ${
                  year === displayMonth.getFullYear() 
                    ? 'bg-indigo-50 text-indigo-600 font-medium' 
                    : ''
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditExpenseModal({ 
  isOpen, 
  onClose, 
  expense, 
  categories, 
  onExpenseUpdated 
}: EditExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [tag, setTag] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tags, setTags] = useState<{tag: string}[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen && expense) {
      setAmount(expense.amount.toString());
      setTag(expense.tag || '');
      setCategoryId(expense.category_id);
      setSelectedDate(new Date(expense.date));
      setSearchTerm('');
      setTagSearchTerm('');
      setError('');
      setIsSubmitting(false);
      setIsDropdownOpen(false);
      setIsTagDropdownOpen(false);
      setIsCalendarOpen(false);
    }
  }, [isOpen, expense]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCalendarOpen && !(event.target as Element).closest('.rdp')) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const fetchTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .rpc('get_distinct_tags', { user_id_param: user.id });
      if (error) throw error;

      setTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const { error: supabaseError } = await supabase
        .from('expenses')
        .update({
          amount: parseFloat(amount),
          tag,
          category_id: categoryId,
          date: format(selectedDate, 'yyyy-MM-dd'),
        })
        .eq('id', expense.id);

      if (supabaseError) throw supabaseError;
      
      onExpenseUpdated();
      onClose();
    } catch (err) {
      setError('Failed to update expense. Please try again.');
      console.error('Error updating expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reuse the same UI components from AddExpenseModal
  const filteredTags = tags.filter(desc =>
    desc.tag.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const handleTagSelect = (selectedTag: string) => {
    setTag(selectedTag);
    setTagSearchTerm('');
    setIsTagDropdownOpen(false);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCategory = categories.find(cat => cat.id === categoryId);

  const handleCategorySelect = (catId: string) => {
    setCategoryId(catId);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
         onClick={(e) => {
           if (e.target === e.currentTarget) {
             setIsDropdownOpen(false);
             onClose();
           }
         }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative border border-gray-100 shadow-xl"
           onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100/80 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
            Edit Expense
          </h2>
          <p className="text-gray-500 text-sm mt-1">Update your expense details</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="relative">
              <div 
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all bg-white cursor-pointer"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              >
                <div className="flex items-center justify-between">
                  <span>{format(selectedDate, 'dd MMM yyyy')}</span>
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {isCalendarOpen && (
                <div 
                  className="absolute left-0 z-50 mt-1 bg-white rounded-xl shadow-lg border border-gray-100"
                >
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                    className="p-3"
                    modifiersStyles={{
                      selected: {
                        background: 'linear-gradient(to right, #6366f1, #ec4899)',
                        color: 'white',
                        fontWeight: '500'
                      }
                    }}
                    styles={dayPickerStyles}
                    components={{
                      Caption: CustomCaption
                    }}
                    showOutsideDays
                    fixedWeeks
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                required
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <div className="relative">
              <input
                type="text"
                value={tagSearchTerm || tag}
                onChange={(e) => {
                  setTagSearchTerm(e.target.value);
                  setTag(e.target.value);
                  setIsTagDropdownOpen(true);
                }}
                onFocus={() => setIsTagDropdownOpen(true)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                placeholder="What did you spend on? (optional)"
              />
              {isTagDropdownOpen && tagSearchTerm && filteredTags.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white/95 backdrop-blur-sm shadow-lg max-h-60 rounded-xl py-1 text-base overflow-auto border border-gray-100">
                  {filteredTags.map((desc) => (
                    <div
                      key={desc.tag}
                      className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      onClick={() => handleTagSelect(desc.tag)}
                    >
                      {desc.tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                placeholder={selectedCategory?.name || "Search categories..."}
              />
              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white/95 backdrop-blur-sm shadow-lg max-h-60 rounded-xl py-1 text-base overflow-auto border border-gray-100">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`cursor-pointer px-4 py-2.5 hover:bg-gray-50 transition-colors flex justify-between items-center
                          ${category.id === categoryId ? 'bg-indigo-50' : ''}`}
                        onClick={() => handleCategorySelect(category.id)}
                        style={{ 
                          backgroundColor: category.id === categoryId ? `${category.color}20` : '',
                          color: category.id === categoryId ? category.color : ''
                        }}
                      >
                        <span>{category.name}</span>
                        {category.id === categoryId && (
                          <Check className="h-4 w-4" style={{ color: category.color }} />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2.5 text-sm text-gray-500">
                      No categories found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
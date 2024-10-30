import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import { X, Check } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onExpenseAdded: () => void;
}

export default function AddExpenseModal({ isOpen, onClose, categories, onExpenseAdded }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [tag, setTag] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tags, setTags] = useState<{tag: string}[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset all form fields when modal opens
      setAmount('');
      setTag('');
      setCategoryId('');
      setSearchTerm('');
      setTagSearchTerm('');
      setError('');
      setIsSubmitting(false);
      setIsDropdownOpen(false);
      setIsTagDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      // Fetch distinct tags using raw SQL query
      const { data, error } = await supabase
        .rpc('get_distinct_tags', { user_id_param: user.id });
      if (error) throw error;

      setTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { error: supabaseError } = await supabase
        .from('expenses')
        .insert([
          {
            amount: parseFloat(amount),
            tag,
            category_id: categoryId,
            date: new Date().toISOString().split('T')[0],
            user_id: user.id
          },
        ]);

      if (supabaseError) throw supabaseError;
      
      onExpenseAdded();
      onClose();
      setAmount('');
      setTag('');
      setCategoryId('');
    } catch (err) {
      setError('Failed to add expense. Please try again.');
      console.error('Error adding expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tagSelector = (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">Tag</label>
      <div className="relative mt-1">
        <input
          type="text"
          value={tagSearchTerm || tag}
          onChange={(e) => {
            setTagSearchTerm(e.target.value);
            setTag(e.target.value);
            setIsTagDropdownOpen(true);
          }}
          onFocus={() => setIsTagDropdownOpen(true)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="What did you spend on? (optional) Add/Choose any Tag"
        />
        {isTagDropdownOpen && tagSearchTerm && filteredTags.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto border border-gray-200">
            {filteredTags.map((desc) => (
              <div
                key={desc.tag}
                className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                onClick={() => handleTagSelect(desc.tag)}
              >
                {desc.tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const categorySelector = (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700">Category</label>
      <div className="relative mt-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder={selectedCategory?.name || "Search categories..."}
        />
        {isDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto border border-gray-200">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={`cursor-pointer px-4 py-2 hover:bg-gray-100 flex justify-between items-center ${
                    category.id === categoryId ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <span>{category.name}</span>
                  {category.id === categoryId && (
                    <Check className="h-4 w-4 text-indigo-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                No categories found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
         onClick={(e) => {
           if (e.target === e.currentTarget) {
             setIsDropdownOpen(false);
           }
         }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
          
          {tagSelector}
          
          {categorySelector}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
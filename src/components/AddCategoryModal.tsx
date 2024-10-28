import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus } from 'lucide-react';
import * as Icons from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
}

const ICON_OPTIONS = [
  'Shopping', 'Car', 'Home', 'Coffee', 'Utensils', 'Plane', 
  'Train', 'Bus', 'Medical', 'Book', 'Music', 'Film',
  'Smartphone', 'Laptop', 'Gift', 'Gym'
];

const COLOR_OPTIONS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4',
  '#FEE440', '#8AC926', '#FF99C8', '#6A4C93', '#B5179E'
];

export default function AddCategoryModal({ isOpen, onClose, onCategoryAdded }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Shopping');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const { error: supabaseError } = await supabase
        .from('categories')
        .insert([{ name, icon, color }]);

      if (supabaseError) throw supabaseError;
      
      onCategoryAdded();
      onClose();
      setName('');
      setIcon('Shopping');
      setColor(COLOR_OPTIONS[0]);
    } catch (err) {
      setError('Failed to add category. Please try again.');
      console.error('Error adding category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Add New Category</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
              placeholder="e.g., Groceries"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map((iconName) => {
                const IconComponent = Icons[iconName as keyof typeof Icons];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`p-2 rounded-lg ${
                      icon === iconName ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'
                    }`}
                  >
                    {IconComponent && <IconComponent className="h-5 w-5" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full ${
                    color === colorOption ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
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
              {isSubmitting ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
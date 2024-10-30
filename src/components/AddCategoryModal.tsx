import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { 
  // Shopping & Retail
  ShoppingCart, ShoppingBag, Store, Gift, 
  // Food & Dining
  Utensils, Coffee, Pizza, Wine,
  // Transportation
  Car, Bus, Train, Plane,
  // Home & Utilities
  Home, Lightbulb, Wifi, Smartphone,
  // Health & Wellness
  Stethoscope, Heart, Dumbbell, Pills,
  // Entertainment
  Tv, Music, Film, Gamepad2,
  // Education
  GraduationCap, Book, Library, PenTool,
  // Personal Care
  Scissors, Bath, Baby, Dog,
  // Business
  Briefcase, Building2, Receipt, CreditCard,
  // Miscellaneous
  Wallet, PiggyBank, DollarSign, Percent
} from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
}

type IconOption = {
  name: string;
  icon: React.ComponentType<any>;
  group: string;
};

const ICON_OPTIONS: IconOption[] = [
  // Shopping & Retail
  { name: 'ShoppingCart', icon: ShoppingCart, group: 'Shopping & Retail' },
  { name: 'ShoppingBag', icon: ShoppingBag, group: 'Shopping & Retail' },
  { name: 'Store', icon: Store, group: 'Shopping & Retail' },
  { name: 'Gift', icon: Gift, group: 'Shopping & Retail' },
  
  // Food & Dining
  { name: 'Utensils', icon: Utensils, group: 'Food & Dining' },
  { name: 'Coffee', icon: Coffee, group: 'Food & Dining' },
  { name: 'Pizza', icon: Pizza, group: 'Food & Dining' },
  { name: 'Wine', icon: Wine, group: 'Food & Dining' },
  
  // Transportation
  { name: 'Car', icon: Car, group: 'Transportation' },
  { name: 'Bus', icon: Bus, group: 'Transportation' },
  { name: 'Train', icon: Train, group: 'Transportation' },
  { name: 'Plane', icon: Plane, group: 'Transportation' },
  
  // Home & Utilities
  { name: 'Home', icon: Home, group: 'Home & Utilities' },
  { name: 'Lightbulb', icon: Lightbulb, group: 'Home & Utilities' },
  { name: 'Wifi', icon: Wifi, group: 'Home & Utilities' },
  { name: 'Smartphone', icon: Smartphone, group: 'Home & Utilities' },
  
  // Health & Wellness
  { name: 'Stethoscope', icon: Stethoscope, group: 'Health & Wellness' },
  { name: 'Heart', icon: Heart, group: 'Health & Wellness' },
  { name: 'Dumbbell', icon: Dumbbell, group: 'Health & Wellness' },
  
  // Entertainment
  { name: 'Tv', icon: Tv, group: 'Entertainment' },
  { name: 'Music', icon: Music, group: 'Entertainment' },
  { name: 'Film', icon: Film, group: 'Entertainment' },
  { name: 'Gamepad', icon: Gamepad2, group: 'Entertainment' },
];

const COLOR_OPTIONS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4',
  '#FEE440', '#8AC926', '#FF99C8', '#6A4C93', '#B5179E'
];

export default function AddCategoryModal({ isOpen, onClose, onCategoryAdded }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ShoppingCart');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error: supabaseError } = await supabase
        .from('categories')
        .insert([{ 
          name, 
          icon, 
          color,
          user_id: user.id
        }]);

      if (supabaseError) throw supabaseError;
      
      onCategoryAdded();
      onClose();
      setName('');
      setIcon('ShoppingCart');
      setColor(COLOR_OPTIONS[0]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category';
      setError(errorMessage);
      console.error('Error adding category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const groupedIcons = ICON_OPTIONS.reduce((groups, icon) => {
    const group = groups[icon.group] || [];
    group.push(icon);
    groups[icon.group] = group;
    return groups;
  }, {} as Record<string, IconOption[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          title="Close modal"
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
            <div className="space-y-4">
              {Object.entries(groupedIcons).map(([group, icons]) => (
                <div key={group}>
                  <h3 className="text-xs font-medium text-gray-500 mb-2">{group}</h3>
                  <div className="grid grid-cols-8 gap-2">
                    {icons.map((iconOption) => {
                      const IconComponent = iconOption.icon;
                      return (
                        <button
                          key={iconOption.name}
                          type="button"
                          title={iconOption.name}
                          onClick={() => setIcon(iconOption.name)}
                          className={`p-2 rounded-lg ${
                            icon === iconOption.name ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  title={`Select color ${colorOption}`}
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
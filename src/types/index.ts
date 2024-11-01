export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  tag?: string;
  date: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ExpenseWithCategory extends Omit<Expense, 'category'> {
  category_name: string;
  category_id: string;
  category_icon: string;
  category_color: string;
}

export interface WeeklyLimit {
  id: string;
  amount: number;
}
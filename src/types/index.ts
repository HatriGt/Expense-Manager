export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  tag: string;
  category_id: string;
  date: string;
  category?: Category;
}

export interface WeeklyLimit {
  id: string;
  amount: number;
}
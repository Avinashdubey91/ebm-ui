export type ExtraExpenseDTO = {
  extraExpenseid?: number;
  apartmentId: number;
  expenseCategoryId: number | null;
  flatId: number | null;
  expenseMonth: string;
  expenseAmount: number;
  expenseDescription?: string | null;
  isShared: boolean;
  isActive: boolean;
};

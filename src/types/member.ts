// src/types/member.ts

export type Installment = {
  amountPaid: number;
  paymentDate: string;
  dueDate?: string | null;
  modeOfPayment?: string;
};

export type Payment = {
  _id: string;
  plan: string;
  actualAmount?: number;
  paymentStatus: string;
  installments?: Installment[];
  createdAt?: string;
  date?: string; // ✅ added for backward compatibility
  totalPaid?: number;
  remainingAmount?: number;
  modeOfPayment?: string;
};

export type Member = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  plan?: string;
  date?: string;
  joinDate?: string;
  status?: string;
  payments?: Payment[];
};

export type Plan = {
  _id: string;
  name: string;
  validity: number;
  validityType?: "months" | "days";
};

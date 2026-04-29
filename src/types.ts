export interface User {
  id: string;
  email: string;
  password: string;
  role: 'tenant' | 'landlord';
  name: string;
  phone: string;
  avatar?: string;
  createdAt: string;
}

export interface House {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'bedsitter' | 'single' | 'double' | 'studio';
  rent: number;
  status: 'occupied' | 'vacant';
  tenantId?: string;
  image?: string;
  description: string;
  amenities: string[];
}

export interface Payment {
  id: string;
  tenantId: string;
  houseId: string;
  amount: number;
  date: string;
  method: 'mpesa' | 'bank' | 'cash';
  status: 'paid' | 'pending' | 'overdue';
  month: string;
  receiptNo: string;
}

export interface Complaint {
  id: string;
  tenantId: string;
  houseId: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'structural' | 'pest' | 'security' | 'other';
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  resolvedAt?: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'rent-reminder' | 'maintenance' | 'emergency';
  targetTenants: string[] | 'all';
  createdAt: string;
  read: string[];
}

export interface TenantAssignment {
  tenantId: string;
  houseId: string;
  moveInDate: string;
  moveOutDate?: string;
  active: boolean;
}

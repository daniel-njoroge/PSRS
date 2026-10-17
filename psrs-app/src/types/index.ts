export type UserRole = 'citizen' | 'admin';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: 'active' | 'suspended';
  created_at?: string;
}

export const REQUEST_CATEGORIES = [
  'Roads & Lighting',
  'Water Services',
  'Waste Management',
  'Drainage & Flooding',
  'Public Spaces & Parks',
  'Public Facilities'
] as const;

export type RequestCategory = typeof REQUEST_CATEGORIES[number];
export const REQUEST_CATEGORY_DESCRIPTIONS: Record<RequestCategory, string> = {
  'Roads & Lighting': 'Broken streetlights and other public road lighting problems.',
  'Water Services': 'Water outages, leaks, damaged public taps, or sewer overflows.',
  'Waste Management': 'Missed garbage collection, overflowing bins, or illegal dumping.',
  'Drainage & Flooding': 'Blocked drains, flooding, or damaged stormwater channels.',
  'Public Spaces & Parks': 'Damaged park equipment, overgrown green spaces, or unsafe public areas.',
  'Public Facilities': 'Damage to public buildings, toilets, or community facilities.'
};
export type RequestStatus = 'Pending' | 'In Progress' | 'Resolved';

export interface CitizenRequest {
  id: string;
  reference_number: string;
  citizen_id: string;
  citizen_name?: string;
  category: RequestCategory;
  location: string;
  description: string;
  image_path: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  history?: Array<{
    status: RequestStatus;
    note: string | null;
    created_at: string;
    updated_by?: string;
  }>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: number;
  type: 'status_update' | 'system';
  created_at: string;
}

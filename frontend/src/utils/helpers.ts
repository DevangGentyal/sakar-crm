import { LeadStatus, LeadSource, PropertyType } from '../types';

// Format currency
export const formatCurrency = (value: number | undefined): string => {
  if (!value) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Format relative time
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + 'y ago';

  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + 'mo ago';

  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + 'd ago';

  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + 'h ago';

  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + 'm ago';

  return 'just now';
};

// Get status label
export const getStatusLabel = (status: LeadStatus): string => {
  const labels: Record<LeadStatus, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    FOLLOW_UP: 'Follow Up',
    INTERESTED: 'Interested',
    SITE_VISIT: 'Site Visit',
    NEGOTIATION: 'Negotiation',
    BOOKED: 'Booked',
    LOST: 'Lost',
  };
  return labels[status] || status;
};

// Get status color
export const getStatusColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-300',
    CONTACTED: 'bg-purple-100 text-purple-800 border-purple-300',
    FOLLOW_UP: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    INTERESTED: 'bg-teal-100 text-teal-800 border-teal-300',
    SITE_VISIT: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    NEGOTIATION: 'bg-orange-100 text-orange-800 border-orange-300',
    BOOKED: 'bg-green-100 text-green-800 border-green-300',
    LOST: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[status] || 'bg-slate-100 text-slate-800 border-slate-300';
};

// Get source label
export const getSourceLabel = (source: LeadSource): string => {
  const labels: Record<LeadSource, string> = {
    FACEBOOK: 'Facebook',
    INSTAGRAM: 'Instagram',
    GOOGLE: 'Google',
    WEBSITE: 'Website',
    WALK_IN: 'Walk In',
    WHATSAPP: 'WhatsApp',
    REFERRAL: 'Referral',
    OTHER: 'Other',
  };
  return labels[source] || source;
};

// Get property type label
export const getPropertyTypeLabel = (type: PropertyType): string => {
  const labels: Record<PropertyType, string> = {
    residential: 'Residential',
    commercial: 'Commercial',
    industrial: 'Industrial',
    land: 'Land',
  };
  return labels[type];
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Check if email is valid
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check if phone is valid
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Format phone number (supports US and Indian formats)
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Indian format: +91 followed by 10 digits
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  // Indian format: 10 digits only
  if (cleaned.length === 10) {
    // Check if it looks like Indian (often starts with specific ranges)
    return `+91 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  // US format: 11 digits with leading 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // US format: 10 digits
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if format not recognized
  return phone;
};

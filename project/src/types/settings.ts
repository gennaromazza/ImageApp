export interface ServiceType {
  id: string;
  name: string;
  enabled: boolean;
  duration?: number; // Duration in minutes
  bookingStartDate?: string;
  bookingEndDate?: string;
  excludedDays?: number[];
  excludedDates?: string[];
}

export interface BreakTime {
  start: string;
  end: string;
  enabled: boolean;
}

export interface BookingStatus {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  enabled: boolean;
}

export interface SocialSettings {
  image: string;
  title: string;
  description: string;
  url: string;
}

export interface EventSettings {
  id: string;
  eventName: string;
  countdownDate: string;
  showCountdown: boolean;
  bookingIntervals: number;
  maxBookingsPerDay: number;
  startTime: string;
  endTime: string;
  serviceTypes: ServiceType[];
  breakTimes: BreakTime[];
  bookingStatuses: BookingStatus[];
  products: Product[];
  company: {
    name: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    socialLinks: Record<string, string>;
  };
  animation: {
    enabled: boolean;
    title: string;
    subtitle: string;
    type: 'curtain' | 'fade' | 'slide';
  };
  social: SocialSettings;
  ticketTemplate: {
    type: 'classic' | 'modern' | 'vintage';
    enabled: boolean;
  };
  whatsappTemplate: {
    header: string;
    productFormat: string;
    paymentFormat: string;
    footer: string;
  };
}
export interface UserBookingSettings {
  userId: string;
  businessName?: string;
  logoUrl?: string;
  themeColor?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  serviceTypes?: {
    id: string;
    name: string;
    enabled: boolean;
  }[];
  breakTimes?: {
    start: string;
    end: string;
    enabled: boolean;
  }[];
  maxBookingsPerDay?: number;
  bookingIntervals?: number;
  startTime?: string;
  endTime?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  bookingSettings?: UserBookingSettings;
}
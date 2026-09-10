export type UserRole = 'CITIZEN' | 'HOSPITAL_STAFF' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  location: string;
  district: string;
  state: string;
  hospitalId?: string; // For HOSPITAL_STAFF
  createdAt: string;
}

export type HospitalType =
  | 'Government Hospital'
  | 'District Hospital'
  | 'Community Health Centre (CHC)'
  | 'Primary Health Centre (PHC)'
  | 'Area Hospital'
  | 'Sub-District Hospital'
  | 'Clinic'
  | 'Diagnostic Centre'
  | 'Pharmacy'
  | 'Blood Bank';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergencyPhone: string;
  openingHours: string;
  hospitalType: HospitalType;
  facilities: string[];
  rating: number; // average quality score (e.g. 4.3)
  totalReviews: number;
  emergencyAvailable: boolean;
  isOpen: boolean;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number; // years
  consultationFee: number; // 0 for government
  availabilityStatus: 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_LEAVE';
  photoUrl?: string;
  availableDays: string[];
  timeSlots: string[];
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface HospitalService {
  id: string;
  hospitalId: string;
  serviceId: string;
  serviceName: string;
  category: string;
  available: boolean;
  waitingTime: string;
  description: string;
  updatedAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface MedicineStock {
  id: string;
  hospitalId: string;
  medicineId: string;
  medicineName: string;
  category: string;
  quantity: number;
  minimumThreshold: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}

export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  appointmentId: string; // e.g. CC-2026-894210
  tokenNumber?: string;  // e.g. TK-42
  userId: string;
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  hospitalId: string;
  hospitalName: string;
  appointmentId?: string;
  doctorRating: number;
  waitingRating: number;
  staffRating: number;
  cleanlinessRating: number;
  medicineRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string;
  createdAt: string;
}

export type ComplaintCategory =
  | 'Doctor unavailable'
  | 'Medicine unavailable'
  | 'Healthcare service unavailable'
  | 'Long waiting time'
  | 'Staff behavior'
  | 'Cleanliness'
  | 'Infrastructure'
  | 'Emergency service issue'
  | 'Other';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER REVIEW'
  | 'IN PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export interface Complaint {
  id: string;
  complaintId: string; // e.g. CMP202600123
  userId: string;
  userName: string;
  hospitalId: string;
  hospitalName: string;
  appointmentId?: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  resolutionRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type LanguageCode = 'en' | 'te' | 'hi';

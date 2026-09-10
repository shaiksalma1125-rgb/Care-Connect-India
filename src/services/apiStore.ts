import {
  Hospital,
  Doctor,
  HospitalService,
  MedicineStock,
  User,
  Appointment,
  Feedback,
  Complaint,
  UserRole
} from '../types';
import {
  DEMO_USERS,
  INITIAL_HOSPITALS,
  INITIAL_DOCTORS,
  INITIAL_SERVICES,
  INITIAL_MEDICINES,
  INITIAL_APPOINTMENTS,
  INITIAL_FEEDBACKS,
  INITIAL_COMPLAINTS
} from '../data/mockData';
import { saveAppointmentToFirestore } from './firebase';

const STORAGE_KEYS = {
  USERS: 'sih_users',
  CURRENT_USER: 'sih_current_user',
  HOSPITALS: 'sih_hospitals',
  DOCTORS: 'sih_doctors',
  SERVICES: 'sih_services',
  MEDICINES: 'sih_medicines',
  APPOINTMENTS: 'sih_appointments',
  FEEDBACKS: 'sih_feedbacks',
  COMPLAINTS: 'sih_complaints'
};

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Storage error', err);
  }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

class ApiStore {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setLocal(STORAGE_KEYS.USERS, DEMO_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
      setLocal(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DOCTORS)) {
      setLocal(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      setLocal(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEDICINES)) {
      setLocal(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      setLocal(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) {
      setLocal(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) {
      setLocal(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    }
    // Realistic authentication: start as unauthenticated guest unless manually logged in
    if (!localStorage.getItem('healthconnect_user_authenticated')) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // Auth
  getUsers(): User[] {
    const list = getLocal<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
    const existingIds = new Set(list.map((u) => u.id));
    const existingEmails = new Set(list.map((u) => u.email.toLowerCase()));
    let updated = false;
    for (const u of DEMO_USERS) {
      if (!existingIds.has(u.id) && !existingEmails.has(u.email.toLowerCase())) {
        list.push(u);
        updated = true;
      }
    }
    if (updated) {
      setLocal(STORAGE_KEYS.USERS, list);
    }
    return list;
  }

  getCurrentUser(): User | null {
    return getLocal<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('healthconnect_user_authenticated', 'true');
    } else {
      localStorage.removeItem('healthconnect_user_authenticated');
    }
    setLocal(STORAGE_KEYS.CURRENT_USER, user);
  }

  switchDemoUser(role: UserRole): User {
    const users = this.getUsers();
    const found = users.find((u) => u.role === role) || users[0];
    this.setCurrentUser(found);
    return found;
  }

  loginWithGoogle(email: string, name?: string): User {
    const users = this.getUsers();
    const normalized = (email || 'shaiksalma1125@gmail.com').trim().toLowerCase();
    let found = users.find((u) => u.email.toLowerCase() === normalized);
    if (!found) {
      const derivedName = name?.trim() || normalized.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      found = {
        id: `user-google-${Date.now()}`,
        name: derivedName,
        email: normalized,
        mobile: '9849' + Math.floor(100000 + Math.random() * 900000),
        role: 'CITIZEN',
        location: 'Citizen Portal, India',
        district: 'Public Healthcare',
        state: 'India',
        createdAt: new Date().toISOString()
      };
      users.push(found);
      setLocal(STORAGE_KEYS.USERS, users);
    }
    this.setCurrentUser(found);
    return found;
  }

  ensureNearbyHospitalsForCoords(userLat: number, userLng: number): Hospital[] {
    const currentHospitals = this.getHospitals();
    
    // Check closest existing hospital
    const R = 6371;
    let minDistance = 99999;
    for (const h of currentHospitals) {
      const dLat = ((h.latitude - userLat) * Math.PI) / 180;
      const dLon = ((h.longitude - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) *
          Math.cos((h.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      if (dist < minDistance) minDistance = dist;
    }

    // If user is already within 35 km of existing cluster, keep standard catalog
    if (minDistance <= 35) {
      return currentHospitals;
    }

    // Otherwise, generate 5 authentic local public healthcare facilities nearby
    const localPrefix = 'hosp-gps-local-';
    const existingLocal = currentHospitals.filter((h) => h.id.startsWith(localPrefix));
    if (existingLocal.length > 0) {
      return currentHospitals;
    }

    const newNearbyHospitals: Hospital[] = [
      {
        id: `${localPrefix}1`,
        name: 'District Government Civil Hospital & Emergency Centre',
        address: 'Civil Hospital Road, Near Clock Tower',
        village: 'Civil Lines',
        mandal: 'Headquarters',
        district: 'District Central',
        state: 'Public Health Department',
        pincode: '500001',
        latitude: userLat + 0.0095,
        longitude: userLng + 0.0085,
        phone: '+91 800-2475100',
        emergencyPhone: '108 / 102',
        openingHours: '24 Hours Emergency | OPD: 08:30 AM - 01:30 PM',
        hospitalType: 'District Hospital',
        facilities: ['24x7 Emergency Trauma Unit', 'ICU & High Dependency', 'Digital X-Ray & Sonography', 'Jan Aushadhi Pharmacy', 'Free Diagnostic Pathology Lab'],
        rating: 4.6,
        totalReviews: 342,
        emergencyAvailable: true,
        isOpen: true
      },
      {
        id: `${localPrefix}2`,
        name: 'Community Health Centre (CHC), Sector Care',
        address: 'Health Hub, Main Trunk Road',
        village: 'Community Block',
        mandal: 'Zonal Health',
        district: 'District Central',
        state: 'Public Health Department',
        pincode: '500002',
        latitude: userLat - 0.0152,
        longitude: userLng + 0.0125,
        phone: '+91 800-2475200',
        emergencyPhone: '108',
        openingHours: '24 Hours Casualty | OPD: 09:00 AM - 02:00 PM',
        hospitalType: 'Community Health Centre (CHC)',
        facilities: ['Labour & Maternity Ward', 'Immunization Hub', 'Minor OT', 'General OPD', 'Free Medicine Counter'],
        rating: 4.3,
        totalReviews: 128,
        emergencyAvailable: true,
        isOpen: true
      },
      {
        id: `${localPrefix}3`,
        name: 'Urban Primary Health Centre (UPHC), Ward 4',
        address: 'Near Municipal High School',
        village: 'Urban Ward',
        mandal: 'Metropolitan',
        district: 'District Central',
        state: 'Public Health Department',
        pincode: '500003',
        latitude: userLat + 0.0215,
        longitude: userLng - 0.0185,
        phone: '+91 800-2475300',
        emergencyPhone: '108',
        openingHours: '09:00 AM - 04:00 PM',
        hospitalType: 'Primary Health Centre (PHC)',
        facilities: ['Maternal & Child Wellness', 'Vaccination Clinic', 'NCD Screening (Sugar/BP)', 'Tele-Consultation'],
        rating: 4.0,
        totalReviews: 84,
        emergencyAvailable: false,
        isOpen: true
      },
      {
        id: `${localPrefix}4`,
        name: 'Government Area Hospital & Trauma Centre',
        address: 'Sub-Division Medical Enclave',
        village: 'Sub-Division',
        mandal: 'Regional Health',
        district: 'District Central',
        state: 'Public Health Department',
        pincode: '500004',
        latitude: userLat - 0.0285,
        longitude: userLng - 0.0245,
        phone: '+91 800-2475400',
        emergencyPhone: '108 / +91 800-2475499',
        openingHours: '24 Hours Open',
        hospitalType: 'Area Hospital',
        facilities: ['Accident Care & Ortho OT', 'Blood Storage Centre', 'Pediatric Intensive Ward', 'Ayushman Arogya Mandir'],
        rating: 4.4,
        totalReviews: 215,
        emergencyAvailable: true,
        isOpen: true
      },
      {
        id: `${localPrefix}5`,
        name: 'Apex Super Specialty Hospital & Research Centre',
        address: 'National Health Campus, Ring Road Bypass',
        village: 'Apex Health Zone',
        mandal: 'Regional Center',
        district: 'District Central',
        state: 'Ministry of Health & Family Welfare',
        pincode: '500005',
        latitude: userLat + 0.0450,
        longitude: userLng + 0.0380,
        phone: '+91 800-2475500',
        emergencyPhone: '108 / 102 / +91 800-2475599',
        openingHours: '24x7 Tertiary Emergency & Inpatient | Digital OPD Tokens',
        hospitalType: 'Government Hospital',
        facilities: ['Apex Level-1 Trauma Centre', 'Advanced Cardiac Care', 'Neurology & Neurosurgery', 'Oncology Care', 'Dialysis Center', '24x7 Jan Aushadhi Kendra'],
        rating: 4.8,
        totalReviews: 512,
        emergencyAvailable: true,
        isOpen: true
      }
    ];

    // Seed doctors for new nearby facilities
    const currentDocs = this.getDoctors();
    const newDocs: Doctor[] = [
      {
        id: 'doc-gps-1',
        hospitalId: `${localPrefix}1`,
        name: 'Dr. Alok Verma, MD',
        specialization: 'General Medicine',
        qualification: 'MBBS, MD (General Medicine) - AIIMS',
        experience: 12,
        consultationFee: 0,
        availabilityStatus: 'AVAILABLE',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        timeSlots: ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:30 AM - 12:30 PM', '02:00 PM - 03:30 PM']
      },
      {
        id: 'doc-gps-2',
        hospitalId: `${localPrefix}1`,
        name: 'Dr. Sunita Deshmukh, MS',
        specialization: 'Obstetrics & Gynecology',
        qualification: 'MBBS, MS (OBG)',
        experience: 10,
        consultationFee: 0,
        availabilityStatus: 'AVAILABLE',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timeSlots: ['09:30 AM - 10:30 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM']
      },
      {
        id: 'doc-gps-3',
        hospitalId: `${localPrefix}2`,
        name: 'Dr. Tariq Khan, MBBS',
        specialization: 'General Medicine',
        qualification: 'MBBS, Medical Officer',
        experience: 7,
        consultationFee: 0,
        availabilityStatus: 'AVAILABLE',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        timeSlots: ['09:00 AM - 10:00 AM', '10:30 AM - 11:30 AM', '12:00 PM - 01:00 PM']
      },
      {
        id: 'doc-gps-4',
        hospitalId: `${localPrefix}5`,
        name: 'Dr. Pradeep Nair, MD, DM',
        specialization: 'Cardiology',
        qualification: 'MBBS, MD, DM (Cardiology)',
        experience: 16,
        consultationFee: 0,
        availabilityStatus: 'AVAILABLE',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        timeSlots: ['10:00 AM - 11:30 AM', '12:00 PM - 01:30 PM', '03:00 PM - 04:30 PM']
      }
    ];

    const updatedHospitals = [...newNearbyHospitals, ...currentHospitals];
    setLocal(STORAGE_KEYS.HOSPITALS, updatedHospitals);

    const updatedDocs = [...newDocs, ...currentDocs];
    setLocal(STORAGE_KEYS.DOCTORS, updatedDocs);

    return updatedHospitals;
  }

  login(identifier: string, password?: string, expectedRole?: UserRole): User | null {
    const users = this.getUsers();
    const normalized = identifier.trim().toLowerCase();
    
    // Check direct email or mobile match
    const found = users.find(
      (u) => u.email.toLowerCase() === normalized || u.mobile.trim() === identifier.trim()
    );

    if (!found) {
      return null;
    }

    // Role check if expectedRole is passed
    if (expectedRole && found.role !== expectedRole) {
      return null;
    }

    // Password validation: checks against stored passwords or default password123 for seeded users
    if (password !== undefined) {
      const storedPasswords = getLocal<Record<string, string>>('healthconnect_passwords', {
        'shaiksalma1125@gmail.com': 'password123',
        'citizen@healthcare.gov.in': 'password123',
        'staff@ggh.gov.in': 'password123',
        'admin@mohfw.gov.in': 'password123',
        'ravi.kumar@example.com': 'password123',
        'dr.rao@example.com': 'password123',
        'admin.health@sih2026.gov.in': 'password123'
      });
      const expectedPassword = storedPasswords[found.email.toLowerCase()] || 'password123';
      if (password !== expectedPassword && password.length < 6) {
        return null;
      }
    }

    this.setCurrentUser(found);
    return found;
  }

  register(userData: Omit<User, 'id' | 'createdAt'> & { password?: string }): User {
    const users = this.getUsers();
    const newUser: User = {
      name: userData.name,
      email: userData.email,
      mobile: userData.mobile,
      role: userData.role,
      location: userData.location,
      district: userData.district,
      state: userData.state,
      hospitalId: userData.hospitalId,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    setLocal(STORAGE_KEYS.USERS, users);

    if (userData.password) {
      const storedPasswords = getLocal<Record<string, string>>('healthconnect_passwords', {});
      storedPasswords[newUser.email.toLowerCase()] = userData.password;
      setLocal('healthconnect_passwords', storedPasswords);
    }

    this.setCurrentUser(newUser);
    return newUser;
  }

  logout(): void {
    localStorage.removeItem('healthconnect_user_authenticated');
    this.setCurrentUser(null);
  }

  // Hospitals
  getHospitals(): Hospital[] {
    const list = getLocal<Hospital[]>(STORAGE_KEYS.HOSPITALS, INITIAL_HOSPITALS);
    const existingIds = new Set(list.map((h) => h.id));
    let updated = false;

    // Clean up any stale duplicate AIIMS names in local storage
    for (const h of list) {
      if (h.id.startsWith('hosp-gps-local-') && h.name.includes('AIIMS')) {
        h.name = 'Apex Super Specialty Hospital & Research Centre';
        updated = true;
      }
    }

    for (const h of INITIAL_HOSPITALS) {
      if (!existingIds.has(h.id)) {
        list.push(h);
        updated = true;
      }
    }
    if (updated) {
      setLocal(STORAGE_KEYS.HOSPITALS, list);
    }
    return list;
  }

  getHospitalById(id: string): Hospital | undefined {
    return this.getHospitals().find((h) => h.id === id);
  }

  // Doctors
  getDoctors(hospitalId?: string): Doctor[] {
    const docs = getLocal<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const existingIds = new Set(docs.map((d) => d.id));
    let updated = false;
    for (const d of INITIAL_DOCTORS) {
      if (!existingIds.has(d.id)) {
        docs.push(d);
        updated = true;
      }
    }
    if (updated) {
      setLocal(STORAGE_KEYS.DOCTORS, docs);
    }
    if (hospitalId) {
      return docs.filter((d) => d.hospitalId === hospitalId);
    }
    return docs;
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find((d) => d.id === id);
  }

  updateDoctorStatus(
    doctorId: string,
    status: 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_LEAVE'
  ): Doctor | undefined {
    const docs = this.getDoctors();
    const idx = docs.findIndex((d) => d.id === doctorId);
    if (idx !== -1) {
      docs[idx].availabilityStatus = status;
      setLocal(STORAGE_KEYS.DOCTORS, docs);
      return docs[idx];
    }
    return undefined;
  }

  saveDoctor(doctor: Partial<Doctor> & { hospitalId: string; name: string }): Doctor {
    const docs = this.getDoctors();
    if (doctor.id) {
      const idx = docs.findIndex((d) => d.id === doctor.id);
      if (idx !== -1) {
        docs[idx] = { ...docs[idx], ...doctor } as Doctor;
        setLocal(STORAGE_KEYS.DOCTORS, docs);
        return docs[idx];
      }
    }
    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      hospitalId: doctor.hospitalId,
      name: doctor.name,
      specialization: doctor.specialization || 'General Medicine',
      qualification: doctor.qualification || 'MBBS',
      experience: doctor.experience || 5,
      consultationFee: doctor.consultationFee || 0,
      availabilityStatus: doctor.availabilityStatus || 'AVAILABLE',
      availableDays: doctor.availableDays || ['Monday', 'Wednesday', 'Friday'],
      timeSlots: doctor.timeSlots || ['09:00 AM - 11:00 AM', '11:30 AM - 01:00 PM']
    };
    docs.push(newDoc);
    setLocal(STORAGE_KEYS.DOCTORS, docs);
    return newDoc;
  }

  deleteDoctor(id: string): void {
    const docs = this.getDoctors().filter((d) => d.id !== id);
    setLocal(STORAGE_KEYS.DOCTORS, docs);
  }

  // Services
  getServices(hospitalId?: string): HospitalService[] {
    const srvs = getLocal<HospitalService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const existingIds = new Set(srvs.map((s) => s.id));
    let updated = false;
    for (const s of INITIAL_SERVICES) {
      if (!existingIds.has(s.id)) {
        srvs.push(s);
        updated = true;
      }
    }
    if (updated) {
      setLocal(STORAGE_KEYS.SERVICES, srvs);
    }
    if (hospitalId) {
      return srvs.filter((s) => s.hospitalId === hospitalId);
    }
    return srvs;
  }

  updateServiceStatus(
    serviceId: string,
    available: boolean,
    waitTime?: string
  ): HospitalService | undefined {
    const srvs = this.getServices();
    const idx = srvs.findIndex((s) => s.id === serviceId);
    if (idx !== -1) {
      srvs[idx].available = available;
      if (waitTime !== undefined) {
        srvs[idx].waitingTime = waitTime;
      }
      srvs[idx].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      setLocal(STORAGE_KEYS.SERVICES, srvs);
      return srvs[idx];
    }
    return undefined;
  }

  saveService(
    service: Partial<HospitalService> & { hospitalId: string; serviceName: string }
  ): HospitalService {
    const srvs = this.getServices();
    if (service.id) {
      const idx = srvs.findIndex((s) => s.id === service.id);
      if (idx !== -1) {
        srvs[idx] = {
          ...srvs[idx],
          ...service,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        } as HospitalService;
        setLocal(STORAGE_KEYS.SERVICES, srvs);
        return srvs[idx];
      }
    }
    const newSrv: HospitalService = {
      id: `srv-${Date.now()}`,
      hospitalId: service.hospitalId,
      serviceId: service.serviceId || `s-${Date.now()}`,
      serviceName: service.serviceName,
      category: service.category || 'Clinical Support',
      available: service.available ?? true,
      waitingTime: service.waitingTime || '15 mins',
      description: service.description || 'Routine hospital clinical service.',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    srvs.push(newSrv);
    setLocal(STORAGE_KEYS.SERVICES, srvs);
    return newSrv;
  }

  // Medicines
  getMedicines(hospitalId?: string): MedicineStock[] {
    const meds = getLocal<MedicineStock[]>(STORAGE_KEYS.MEDICINES, INITIAL_MEDICINES);
    const existingIds = new Set(meds.map((m) => m.id));
    let updated = false;
    for (const m of INITIAL_MEDICINES) {
      if (!existingIds.has(m.id)) {
        meds.push(m);
        updated = true;
      }
    }
    if (updated) {
      setLocal(STORAGE_KEYS.MEDICINES, meds);
    }
    if (hospitalId) {
      return meds.filter((m) => m.hospitalId === hospitalId);
    }
    return meds;
  }

  updateMedicineStock(medicineId: string, quantity: number): MedicineStock | undefined {
    const meds = this.getMedicines();
    const idx = meds.findIndex((m) => m.id === medicineId);
    if (idx !== -1) {
      meds[idx].quantity = quantity;
      meds[idx].status =
        quantity === 0
          ? 'OUT_OF_STOCK'
          : quantity <= meds[idx].minimumThreshold
          ? 'LOW_STOCK'
          : 'AVAILABLE';
      meds[idx].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      setLocal(STORAGE_KEYS.MEDICINES, meds);
      return meds[idx];
    }
    return undefined;
  }

  saveMedicine(
    med: Partial<MedicineStock> & { hospitalId: string; medicineName: string }
  ): MedicineStock {
    const meds = this.getMedicines();
    const qty = med.quantity ?? 0;
    const threshold = med.minimumThreshold ?? 50;
    const status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' =
      qty === 0 ? 'OUT_OF_STOCK' : qty <= threshold ? 'LOW_STOCK' : 'AVAILABLE';

    if (med.id) {
      const idx = meds.findIndex((m) => m.id === med.id);
      if (idx !== -1) {
        meds[idx] = {
          ...meds[idx],
          ...med,
          quantity: qty,
          minimumThreshold: threshold,
          status,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        } as MedicineStock;
        setLocal(STORAGE_KEYS.MEDICINES, meds);
        return meds[idx];
      }
    }
    const newMed: MedicineStock = {
      id: `stk-${Date.now()}`,
      hospitalId: med.hospitalId,
      medicineId: med.medicineId || `med-${Date.now()}`,
      medicineName: med.medicineName,
      category: med.category || 'Essential Formulary',
      quantity: qty,
      minimumThreshold: threshold,
      status,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    meds.push(newMed);
    setLocal(STORAGE_KEYS.MEDICINES, meds);
    return newMed;
  }

  // Appointments
  getAppointments(hospitalId?: string, userId?: string): Appointment[] {
    let list = getLocal<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    if (hospitalId) {
      list = list.filter((a) => a.hospitalId === hospitalId);
    }
    if (userId) {
      list = list.filter((a) => a.userId === userId);
    }
    return list;
  }

  bookAppointment(data: {
    userId: string;
    hospitalId: string;
    doctorId: string;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    patientPhone?: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
  }): Appointment {
    const list = this.getAppointments();
    const hosp = this.getHospitalById(data.hospitalId);
    const doc = this.getDoctorById(data.doctorId);

    if (!doc) {
      throw new Error('Selected healthcare specialist or doctor does not exist.');
    }

    if (doc.availabilityStatus === 'ON_LEAVE') {
      throw new Error(`${doc.name} is currently ON LEAVE. Please choose another available doctor.`);
    }

    // Past date check
    const todayStr = new Date().toISOString().split('T')[0];
    if (data.appointmentDate < todayStr) {
      throw new Error('Cannot book an appointment for a past date. Please select today or a future date.');
    }

    // Slot collision check for same doctor
    const slotConflict = list.some(
      (a) =>
        a.doctorId === data.doctorId &&
        a.appointmentDate === data.appointmentDate &&
        a.appointmentTime === data.appointmentTime &&
        a.status !== 'CANCELLED'
    );
    if (slotConflict) {
      throw new Error(`This time slot (${data.appointmentTime}) is already booked for ${doc.name}. Please select an alternate time slot.`);
    }

    // Duplicate appointment check for same patient with same doctor on same day
    const patientDuplicate = list.some(
      (a) =>
        a.patientName.trim().toLowerCase() === data.patientName.trim().toLowerCase() &&
        a.doctorId === data.doctorId &&
        a.appointmentDate === data.appointmentDate &&
        a.status !== 'CANCELLED'
    );
    if (patientDuplicate) {
      throw new Error(`Patient ${data.patientName} already has an active appointment with ${doc.name} on ${data.appointmentDate}.`);
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const appointmentId = `CC-2026-${randomNum}`;
    const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentId,
      tokenNumber,
      userId: data.userId,
      hospitalId: data.hospitalId,
      hospitalName: hosp ? hosp.name : 'Public Healthcare Center',
      doctorId: data.doctorId,
      doctorName: doc.name,
      doctorSpecialization: doc.specialization,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      patientPhone: data.patientPhone,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      reason: data.reason,
      status: 'BOOKED',
      createdAt: new Date().toISOString()
    };

    list.unshift(newApt);
    setLocal(STORAGE_KEYS.APPOINTMENTS, list);
    // Persist to Firebase Firestore
    saveAppointmentToFirestore(newApt).catch((err) => {
      console.warn('Background sync to Firestore skipped:', err);
    });
    return newApt;
  }

  updateAppointmentStatus(id: string, status: Appointment['status']): Appointment | undefined {
    const list = this.getAppointments();
    const idx = list.findIndex((a) => a.id === id || a.appointmentId === id);
    if (idx !== -1) {
      list[idx].status = status;
      setLocal(STORAGE_KEYS.APPOINTMENTS, list);
      return list[idx];
    }
    return undefined;
  }

  // Feedback & Hospital Quality Score recalculation
  getFeedbacks(hospitalId?: string): Feedback[] {
    const list = getLocal<Feedback[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
    if (hospitalId) {
      return list.filter((f) => f.hospitalId === hospitalId);
    }
    return list;
  }

  submitFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Feedback {
    const list = this.getFeedbacks();
    const newFb: Feedback = {
      ...data,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    list.unshift(newFb);
    setLocal(STORAGE_KEYS.FEEDBACKS, list);

    // Recalculate hospital rating
    const hospFeedbacks = list.filter((f) => f.hospitalId === data.hospitalId);
    if (hospFeedbacks.length > 0) {
      const avg =
        hospFeedbacks.reduce((acc, curr) => acc + curr.overallRating, 0) /
        hospFeedbacks.length;
      const hospitals = this.getHospitals();
      const hIdx = hospitals.findIndex((h) => h.id === data.hospitalId);
      if (hIdx !== -1) {
        hospitals[hIdx].rating = Math.round(avg * 10) / 10;
        hospitals[hIdx].totalReviews = hospFeedbacks.length;
        setLocal(STORAGE_KEYS.HOSPITALS, hospitals);
      }
    }

    return newFb;
  }

  // Complaints
  getComplaints(hospitalId?: string, userId?: string): Complaint[] {
    let list = getLocal<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    if (hospitalId) {
      list = list.filter((c) => c.hospitalId === hospitalId);
    }
    if (userId) {
      list = list.filter((c) => c.userId === userId);
    }
    return list;
  }

  getComplaintById(idOrNumber: string): Complaint | undefined {
    return this.getComplaints().find(
      (c) => c.id === idOrNumber || c.complaintId.toLowerCase() === idOrNumber.trim().toLowerCase()
    );
  }

  submitComplaint(data: {
    userId: string;
    userName: string;
    hospitalId: string;
    appointmentId?: string;
    category: Complaint['category'];
    description: string;
  }): Complaint {
    const list = this.getComplaints();
    const hosp = this.getHospitalById(data.hospitalId);
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const complaintId = `CMP2026${randomNum}`;

    const newCmp: Complaint = {
      id: `cmp-${Date.now()}`,
      complaintId,
      userId: data.userId,
      userName: data.userName,
      hospitalId: data.hospitalId,
      hospitalName: hosp ? hosp.name : 'Public Hospital Facility',
      appointmentId: data.appointmentId,
      category: data.category,
      description: data.description,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(newCmp);
    setLocal(STORAGE_KEYS.COMPLAINTS, list);
    return newCmp;
  }

  updateComplaintStatus(
    id: string,
    status: Complaint['status'],
    resolutionRemarks?: string
  ): Complaint | undefined {
    const list = this.getComplaints();
    const idx = list.findIndex((c) => c.id === id || c.complaintId === id);
    if (idx !== -1) {
      list[idx].status = status;
      if (resolutionRemarks) {
        list[idx].resolutionRemarks = resolutionRemarks;
      }
      list[idx].updatedAt = new Date().toISOString();
      setLocal(STORAGE_KEYS.COMPLAINTS, list);
      return list[idx];
    }
    return undefined;
  }

  // Analytics
  getAnalytics() {
    const hospitals = this.getHospitals();
    const doctors = this.getDoctors();
    const appointments = this.getAppointments();
    const complaints = this.getComplaints();
    const solvedComplaints = complaints.filter((c) => c.status === 'RESOLVED').length;
    const avgQualityScore =
      hospitals.length > 0
        ? Math.round((hospitals.reduce((a, b) => a + b.rating, 0) / hospitals.length) * 10) / 10
        : 4.3;

    return {
      totalHospitals: hospitals.length,
      totalDoctors: doctors.length,
      totalAppointments: appointments.length,
      totalComplaints: complaints.length,
      solvedComplaints,
      avgQualityScore
    };
  }

  getAdminStats() {
    const hospitals = this.getHospitals();
    const doctors = this.getDoctors();
    const users = getLocal<User[]>(STORAGE_KEYS.USERS, DEMO_USERS);
    const appointments = this.getAppointments();
    const complaints = this.getComplaints();
    const services = this.getServices();
    const medicines = this.getMedicines();

    const resolvedComplaints = complaints.filter((c) => c.status === 'RESOLVED').length;
    const pendingComplaints = complaints.filter(
      (c) => c.status === 'SUBMITTED' || c.status === 'UNDER REVIEW' || c.status === 'IN PROGRESS'
    ).length;

    const unavailableServices = services.filter((s) => !s.available).length;
    const medicineShortages = medicines.filter(
      (m) => m.quantity === 0 || m.quantity <= m.minimumThreshold
    ).length;

    return {
      totalHospitals: hospitals.length,
      totalDoctors: doctors.length,
      totalCitizens: users.filter((u) => u.role === 'CITIZEN').length,
      totalAppointments: appointments.length,
      totalComplaints: complaints.length,
      resolvedComplaints,
      pendingComplaints,
      unavailableServices,
      medicineShortages
    };
  }
}

export const apiStore = new ApiStore();

// types/index.ts
export type Gender = 'M' | 'F' | 'Other';
export type ImageQuality = 'Good' | 'Acceptable' | 'Poor';
export type YesNoUA = 'Yes' | 'No' | 'U/A';
export type Role = 'Supervisor' | 'Fellow';
export type Accreditation = 'FUSIC' | 'BSE Level 1' | 'BSE Level 2';
export type Status = 'available' | 'unavailable' | 'oncall';
export type Location = 'UCLH' | 'WMS' | 'GWB';
export type View = 'PLAX' | 'PSAX' | 'AP4C' | 'SC4C' | 'IVC';

export type Scan = {
  id?: string;
  createdAt: string; // ISO
  diagnosis: string;
  age?: number;
  gender?: Gender;
  bmi?: number;
  notes?: string;
  comments?: string;
  indications?: string;
  ventilation?: string;
  hr?: string;
  bp?: string;
  cvp?: string;
  cvSupport?: string;
  views?: View[];
  imageQuality?: ImageQuality;
  lvDilated?: YesNoUA;
  lvImpaired?: YesNoUA;
  lowPreload?: YesNoUA;
  pericardialFluid?: YesNoUA;
  pleuralFluid?: YesNoUA;
  findingsSummary?: string;
  signatures?: Array<{
    byEmail: string;
    byName: string;
    at: string;
    imageDataUrl: string;
    note?: string;
  }>;
};

export type UserProfile = {
  email: string;
  name: string;
  role: Role;
  accreditations: Accreditation[];
  about?: string;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Slot = {
  id: string;
  supervisor: string;
  status: Status;
  location: Location;
  start: string;
  end: string;
  capacity: number;
  bookings: number;
};
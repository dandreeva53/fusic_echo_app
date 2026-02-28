// lib/constants.ts
import type { Role, Accreditation, Status, Location, View, ImageQuality, YesNoUA, EventLocation } from '@/lib/types';

export const ROLES: Role[] = ['Supervisor', 'Mentor', 'Fellow'];

export const ACCREDITATIONS: Accreditation[] = [
  'FUSIC', 
  'BSE Level 1', 
  'BSE Level 2'
];

export const STATUSES: Status[] = [
  'available', 
  'unavailable', 
  'event'
];

export const LOCATIONS: Location[] = ['UCLH', 'WMS', 'GWB'];

export const EVENTLOCATION: EventLocation[] = ['Online', 'UCLH', 'WMS', 'GWB'];

export const VIEWS: View[] = ['PLAX', 'PSAX', 'AP4C', 'SC4C', 'IVC'];

export const IMAGE_QUALITIES: ImageQuality[] = [
  'Good', 
  'Acceptable', 
  'Poor'
];

export const YES_NO_UA: YesNoUA[] = ['Yes', 'No', 'U/A'];

export const GENDERS = ['F', 'M', 'Other'] as const;

export const STATUS_LABELS: Record<Status, string> = {
  available: 'Available to supervise',
  event: 'Event',
  unavailable: 'Unavailable',
};
export interface ContactInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  jobTitle: string;
  website: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactsDatabase {
  [id: string]: ContactInfo;
}
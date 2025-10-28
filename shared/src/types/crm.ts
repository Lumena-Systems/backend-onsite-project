// CRM Types and Schemas

export type CRMType = 'salesforce' | 'hubspot' | 'pipedrive';
export type ResourceType = 'contacts' | 'deals' | 'companies';
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';

// Base interface for all CRM records
export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

// Salesforce Schemas
export interface SalesforceContact extends BaseRecord {
  Email: string;
  FirstName: string;
  LastName: string;
  Phone?: string;
  AccountId?: string;
  OwnerId?: string;
  Title?: string;
  Department?: string;
}

export interface SalesforceDeal extends BaseRecord {
  Name: string;
  Amount: number;
  Stage: string;
  CloseDate: string;
  ContactId?: string;
  AccountId?: string;
  Probability?: number;
  Description?: string;
}

export interface SalesforceCompany extends BaseRecord {
  Name: string;
  Industry?: string;
  Phone?: string;
  Website?: string;
  NumberOfEmployees?: number;
  AnnualRevenue?: number;
  BillingStreet?: string;
  BillingCity?: string;
  BillingState?: string;
  BillingCountry?: string;
}

// HubSpot Schemas
export interface HubSpotContact extends BaseRecord {
  email_address: string;
  firstname: string;
  lastname: string;
  phone_number?: string;
  company_id?: string;
  owner_id?: string;
  job_title?: string;
  department?: string;
}

export interface HubSpotDeal extends BaseRecord {
  deal_name: string;
  amount: number;
  deal_stage: string;
  close_date: string;
  contact_id?: string;
  company_id?: string;
  probability?: number;
  description?: string;
}

export interface HubSpotCompany extends BaseRecord {
  company_name: string;
  industry?: string;
  phone?: string;
  website?: string;
  number_of_employees?: number;
  annual_revenue?: number;
  street_address?: string;
  city?: string;
  state?: string;
  country?: string;
}

// Pipedrive Schemas
export interface PipedriveContact extends BaseRecord {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  organization_id?: string;
  owner_id?: string;
  job_title?: string;
  department?: string;
}

export interface PipedriveDeal extends BaseRecord {
  title: string;
  value: number;
  status: string;
  expected_close_date: string;
  person_id?: string;
  organization_id?: string;
  probability?: number;
  description?: string;
}

export interface PipedriveCompany extends BaseRecord {
  name: string;
  industry?: string;
  phone?: string;
  website?: string;
  people_count?: number;
  annual_revenue?: number;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_country?: string;
}

// Union types for each resource across CRMs
export type Contact = SalesforceContact | HubSpotContact | PipedriveContact;
export type Deal = SalesforceDeal | HubSpotDeal | PipedriveDeal;
export type Company = SalesforceCompany | HubSpotCompany | PipedriveCompany;

export type AnyRecord = Contact | Deal | Company;

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

// Filtering
export interface FilterParams {
  updated_since?: string;
  [key: string]: any;
}

// Query parameters
export interface QueryParams extends PaginationParams, FilterParams {}


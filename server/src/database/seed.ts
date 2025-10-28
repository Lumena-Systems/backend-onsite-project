import { faker } from '@faker-js/faker';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

interface SeedConfig {
  contactsPerCRM: number;
  dealsPerCRM: number;
  companiesPerCRM: number;
}

const defaultConfig: SeedConfig = {
  contactsPerCRM: 100,
  dealsPerCRM: 50,
  companiesPerCRM: 30,
};

export function seedDatabase(db: Database.Database, config: SeedConfig = defaultConfig) {
  console.log('🌱 Seeding database with mock data...');
  
  // Seed each CRM
  seedSalesforce(db, config);
  seedHubSpot(db, config);
  seedPipedrive(db, config);
  
  console.log('✅ Database seeding complete!');
}

function seedSalesforce(db: Database.Database, config: SeedConfig) {
  console.log('  📊 Seeding Salesforce...');
  
  // Seed companies first (for referential integrity)
  const companyIds: string[] = [];
  const insertCompany = db.prepare(`
    INSERT INTO salesforce_companies 
    (id, Name, Industry, Phone, Website, NumberOfEmployees, AnnualRevenue, 
     BillingStreet, BillingCity, BillingState, BillingCountry, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < config.companiesPerCRM; i++) {
    const id = uuidv4();
    companyIds.push(id);
    const now = faker.date.past({ years: 2 }).toISOString();
    
    insertCompany.run(
      id,
      faker.company.name(),
      faker.helpers.arrayElement(['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education']),
      faker.phone.number(),
      faker.internet.url(),
      faker.number.int({ min: 10, max: 10000 }),
      faker.number.int({ min: 100000, max: 100000000 }),
      faker.location.streetAddress(),
      faker.location.city(),
      faker.location.state(),
      faker.location.country(),
      now,
      now
    );
  }

  // Seed contacts
  const contactIds: string[] = [];
  const insertContact = db.prepare(`
    INSERT INTO salesforce_contacts 
    (id, Email, FirstName, LastName, Phone, AccountId, OwnerId, Title, Department, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < config.contactsPerCRM; i++) {
    const id = uuidv4();
    contactIds.push(id);
    const now = faker.date.past({ years: 2 }).toISOString();
    
    insertContact.run(
      id,
      faker.internet.email(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.phone.number(),
      faker.helpers.arrayElement(companyIds),
      uuidv4(),
      faker.person.jobTitle(),
      faker.helpers.arrayElement(['Sales', 'Marketing', 'Engineering', 'Operations', 'HR', 'Finance']),
      now,
      now
    );
  }

  // Seed deals
  const insertDeal = db.prepare(`
    INSERT INTO salesforce_deals 
    (id, Name, Amount, Stage, CloseDate, ContactId, AccountId, Probability, Description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  
  for (let i = 0; i < config.dealsPerCRM; i++) {
    const id = uuidv4();
    const now = faker.date.past({ years: 1 }).toISOString();
    const stage = faker.helpers.arrayElement(stages);
    
    insertDeal.run(
      id,
      faker.commerce.productName() + ' Deal',
      faker.number.int({ min: 1000, max: 500000 }),
      stage,
      faker.date.future().toISOString(),
      faker.helpers.arrayElement(contactIds),
      faker.helpers.arrayElement(companyIds),
      stage === 'Closed Won' ? 100 : faker.number.int({ min: 10, max: 90 }),
      faker.lorem.sentence(),
      now,
      now
    );
  }
}

function seedHubSpot(db: Database.Database, config: SeedConfig) {
  console.log('  📊 Seeding HubSpot...');
  
  // Seed companies
  const companyIds: string[] = [];
  const insertCompany = db.prepare(`
    INSERT INTO hubspot_companies 
    (id, company_name, industry, phone, website, number_of_employees, annual_revenue, 
     street_address, city, state, country, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < config.companiesPerCRM; i++) {
    const id = uuidv4();
    companyIds.push(id);
    const now = faker.date.past({ years: 2 }).toISOString();
    
    insertCompany.run(
      id,
      faker.company.name(),
      faker.helpers.arrayElement(['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education']),
      faker.phone.number(),
      faker.internet.url(),
      faker.number.int({ min: 10, max: 10000 }),
      faker.number.int({ min: 100000, max: 100000000 }),
      faker.location.streetAddress(),
      faker.location.city(),
      faker.location.state(),
      faker.location.country(),
      now,
      now
    );
  }

  // Seed contacts
  const contactIds: string[] = [];
  const insertContact = db.prepare(`
    INSERT INTO hubspot_contacts 
    (id, email_address, firstname, lastname, phone_number, company_id, owner_id, job_title, department, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < config.contactsPerCRM; i++) {
    const id = uuidv4();
    contactIds.push(id);
    const now = faker.date.past({ years: 2 }).toISOString();
    
    insertContact.run(
      id,
      faker.internet.email(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.phone.number(),
      faker.helpers.arrayElement(companyIds),
      uuidv4(),
      faker.person.jobTitle(),
      faker.helpers.arrayElement(['Sales', 'Marketing', 'Engineering', 'Operations', 'HR', 'Finance']),
      now,
      now
    );
  }

  // Seed deals
  const insertDeal = db.prepare(`
    INSERT INTO hubspot_deals 
    (id, deal_name, amount, deal_stage, close_date, contact_id, company_id, probability, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stages = ['Lead', 'Qualified', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost'];
  
  for (let i = 0; i < config.dealsPerCRM; i++) {
    const id = uuidv4();
    const now = faker.date.past({ years: 1 }).toISOString();
    const stage = faker.helpers.arrayElement(stages);
    
    insertDeal.run(
      id,
      faker.commerce.productName() + ' Opportunity',
      faker.number.int({ min: 1000, max: 500000 }),
      stage,
      faker.date.future().toISOString(),
      faker.helpers.arrayElement(contactIds),
      faker.helpers.arrayElement(companyIds),
      stage === 'Won' ? 100 : faker.number.int({ min: 10, max: 90 }),
      faker.lorem.sentence(),
      now,
      now
    );
  }
}

function seedPipedrive(db: Database.Database, config: SeedConfig) {
  console.log('  📊 Seeding Pipedrive...');
  
  // Seed companies
  const companyIds: string[] = [];
  const insertCompany = db.prepare(`
    INSERT INTO pipedrive_companies 
    (id, name, industry, phone, website, people_count, annual_revenue, 
     address_street, address_city, address_state, address_country, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < config.companiesPerCRM; i++) {
    const id = uuidv4();
    companyIds.push(id);
    const now = faker.date.past({ years: 2 }).toISOString();
    
    insertCompany.run(
      id,
      faker.company.name(),
      faker.helpers.arrayElement(['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education']),
      faker.phone.number(),
      faker.internet.url(),
      faker.number.int({ min: 10, max: 10000 }),
      faker.number.int({ min: 100000, max: 100000000 }),
      faker.location.streetAddress(),
      faker.location.city(),
      faker.location.state(),
      faker.location.country(),
      now,
      now
    );
  }

  // Seed contacts
  const contactIds: string[] = [];
  const insertContact = db.prepare(`
    INSERT INTO pipedrive_contacts 
    (id, email, first_name, last_name, phone, organization_id, owner_id, job_title, department, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < config.contactsPerCRM; i++) {
    const id = uuidv4();
    contactIds.push(id);
    const now = faker.date.past({ years: 2 }).toISOString();
    
    insertContact.run(
      id,
      faker.internet.email(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.phone.number(),
      faker.helpers.arrayElement(companyIds),
      uuidv4(),
      faker.person.jobTitle(),
      faker.helpers.arrayElement(['Sales', 'Marketing', 'Engineering', 'Operations', 'HR', 'Finance']),
      now,
      now
    );
  }

  // Seed deals
  const insertDeal = db.prepare(`
    INSERT INTO pipedrive_deals 
    (id, title, value, status, expected_close_date, person_id, organization_id, probability, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const statuses = ['Open', 'In Progress', 'Almost Done', 'Won', 'Lost'];
  
  for (let i = 0; i < config.dealsPerCRM; i++) {
    const id = uuidv4();
    const now = faker.date.past({ years: 1 }).toISOString();
    const status = faker.helpers.arrayElement(statuses);
    
    insertDeal.run(
      id,
      faker.commerce.productName() + ' Sale',
      faker.number.int({ min: 1000, max: 500000 }),
      status,
      faker.date.future().toISOString(),
      faker.helpers.arrayElement(contactIds),
      faker.helpers.arrayElement(companyIds),
      status === 'Won' ? 100 : faker.number.int({ min: 10, max: 90 }),
      faker.lorem.sentence(),
      now,
      now
    );
  }
}


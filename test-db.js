const Database = require('better-sqlite3');
const db = new Database('./database/mock-crm.db');

console.log('Testing database queries...\n');

// Test 1: Direct table query
try {
  const stmt = db.prepare('SELECT * FROM salesforce_contacts LIMIT 2');
  const contacts = stmt.all();
  console.log('✓ Direct query works:', contacts.length, 'contacts');
  console.log(contacts[0]);
} catch (error) {
  console.error('✗ Direct query failed:', error.message);
}

// Test 2: Variable table name
const crm = 'salesforce';
const resource = 'contacts';
const tableName = `${crm}_${resource}`;

try {
  const query = `SELECT * FROM ${tableName} LIMIT 2`;
  console.log('\nQuery:', query);
  const stmt = db.prepare(query);
  const contacts = stmt.all();
  console.log('✓ Variable table name works:', contacts.length, 'contacts');
} catch (error) {
  console.error('✗ Variable table name failed:', error.message);
}

// Test 3: With WHERE clause
try {
  const query = `SELECT * FROM ${tableName} WHERE 1=1 LIMIT 2`;
  const stmt = db.prepare(query);
  const contacts = stmt.all();
  console.log('✓ WHERE clause works:', contacts.length, 'contacts');
} catch (error) {
  console.error('✗ WHERE clause failed:', error.message);
}

db.close();
console.log('\nDatabase tests complete!');


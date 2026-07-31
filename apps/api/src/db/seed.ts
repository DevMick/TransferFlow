import { db } from './index.js';
import { bank, currency } from './schema.js';

async function seed() {
  console.log('Seeding reference data...');

  // Seed banks
  const banks = [
    { name: 'BNP Paribas', country: 'FR' },
    { name: 'Société Générale', country: 'FR' },
    { name: 'Crédit Agricole', country: 'FR' },
    { name: 'LCL', country: 'FR' },
    { name: 'HSBC France', country: 'FR' },
    { name: 'Deutsche Bank', country: 'DE' },
    { name: 'Commerzbank', country: 'DE' },
    { name: 'ING', country: 'NL' },
    { name: 'ABN AMRO', country: 'NL' },
    { name: 'Rabobank', country: 'NL' },
    { name: 'Barclays', country: 'GB' },
    { name: 'HSBC UK', country: 'GB' },
    { name: 'Lloyds Bank', country: 'GB' },
    { name: 'Santander', country: 'ES' },
    { name: 'BBVA', country: 'ES' },
  ];

  for (const bankData of banks) {
    await db.insert(bank).values(bankData).onConflictDoNothing();
  }

  console.log(`Seeded ${banks.length} banks`);

  // Seed currencies
  const currencies = [
    { code: 'EUR', name: 'Euro', symbol: '€', isActive: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', isActive: true },
    { code: 'GBP', name: 'British Pound', symbol: '£', isActive: true },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', isActive: true },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', isActive: true },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', isActive: true },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', isActive: true },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', isActive: true },
  ];

  for (const currencyData of currencies) {
    await db.insert(currency).values(currencyData).onConflictDoNothing();
  }

  console.log(`Seeded ${currencies.length} currencies`);
  console.log('Seeding completed successfully!');
}

seed().catch(console.error);

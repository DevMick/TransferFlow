const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  password: '29122003',
  host: 'localhost',
  port: 5432,
  database: 'postgres'
});

async function createDatabase() {
  try {
    await client.connect();
    await client.query('CREATE DATABASE transferflow');
    console.log('Base de données transferflow créée avec succès');
    await client.end();
  } catch (error) {
    if (error.code === '42P04') {
      console.log('La base de données transferflow existe déjà');
    } else {
      console.error('Erreur:', error);
    }
    await client.end();
    process.exit(1);
  }
}

createDatabase();

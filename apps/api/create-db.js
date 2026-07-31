import { Client } from 'pg';
const client = new Client({
  user: 'postgres',
  password: '29122003',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
});

async function createDatabase() {
  try {
    await client.connect();
    // Supprimer la base de données si elle existe
    await client.query('DROP DATABASE IF EXISTS transferflow');
    console.log('Base de données transferflow supprimée');
    // Créer la base de données
    await client.query('CREATE DATABASE transferflow');
    console.log('Base de données transferflow créée avec succès');
    await client.end();
  } catch (error) {
    console.error('Erreur:', error);
    await client.end();
    process.exit(1);
  }
}

createDatabase();

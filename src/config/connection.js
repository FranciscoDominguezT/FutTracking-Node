const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.cryvkjhhbrsdmffgqmbj',
  password: 'tu_contraseña_aquí',
  ssl: { rejectUnauthorized: false } 
});

client.connect()
  .then(() => console.log('Conectado a la base de datos en el puerto 6543'))
  .catch(err => console.error('Error conectando a la base de datos:', err.stack))
  .finally(() => client.end());

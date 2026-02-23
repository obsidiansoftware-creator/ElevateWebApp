// lib/db.js
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
<<<<<<< HEAD
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});
=======
  host: 'tramway.proxy.rlwy.net',
  port: 37245,
  user: 'root',
  password: 'BgzwrpehmYEcLwqHYnoRLrKzkGaMDAyk',
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,
});
>>>>>>> 27630397a38b0a100a6109fb01242c9478d1a792

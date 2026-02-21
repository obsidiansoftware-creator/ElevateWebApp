// lib/db.js
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: https://mysql://root:BgzwrpehmYEcLwqHYnoRLrKzkGaMDAyk@tramway.proxy.rlwy.net:37245/railway,
  user: root,
  password: BgzwrpehmYEcLwqHYnoRLrKzkGaMDAyk,
  database: railway,
  waitForConnections: true,
  connectionLimit: 10,
});

// lib/db.js
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: tramway.proxy.rlwy.net:37245,
  user: root,
  password: BgzwrpehmYEcLwqHYnoRLrKzkGaMDAyk,
  database: railway,
  waitForConnections: true,
  connectionLimit: 10,
});

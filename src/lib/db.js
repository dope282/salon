// MySQL/MariaDB холболтын pool. ЗӨВХӨН серверт (API routes / scripts) ашиглана.
import mysql from 'mysql2/promise';

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'salon',
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL || 10),
      queueLimit: 0,
      charset: 'utf8mb4',
      // DATE/DATETIME-г string-ээр буцаана (Supabase-ийн адил; апп огноог string-ээр боловсруулдаг)
      dateStrings: true,
    });
  }
  return pool;
}

// Параметртэй query. `pool.query` нь IN (?) дотор массивыг өргөтгөдөг (execute хийдэггүй).
export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

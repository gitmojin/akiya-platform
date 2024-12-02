// lib/db/client.ts

import postgres from 'postgres'

// Connection configuration
const sql = postgres({
  host: process.env.AKIYA_DB_HOST || 'localhost',
  port: 5432,
  database: process.env.AKIYA_DB_NAME || 'akiya_municipality_db',
  username: process.env.AKIYA_DB_USER || 'akiya_user',
  password: process.env.AKIYA_DB_PASS || 'akiya_pass',
  ssl: process.env.NODE_ENV === 'production',
})

export default sql
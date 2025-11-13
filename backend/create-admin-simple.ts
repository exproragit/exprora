/**
 * Quick admin creation script
 * Run: DATABASE_URL=your-db-url npx tsx create-admin-simple.ts
 */

import bcrypt from 'bcryptjs';
import pool from './src/database/connection';

async function createAdmin() {
  const email = 'shubhambaliyan360@gmail.com';
  const password = 'exproramain';
  const name = 'Shubham Baliyan';

  try {
    console.log('Creating admin account...');

    // Check if exists
    const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('✅ Admin account already exists!');
      console.log(`Email: ${email}`);
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'super_admin')
       RETURNING id, email, name, role`,
      [email, passwordHash, name]
    );

    console.log('\n✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${result.rows[0].email}`);
    console.log(`Name:     ${result.rows[0].name}`);
    console.log(`Role:     ${result.rows[0].role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nYou can now login at: https://exprora.com/login');
    console.log('Use the credentials above.\n');

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === '23505') {
      console.error('Admin with this email already exists!');
    }
    await pool.end();
    process.exit(1);
  }
}

createAdmin();


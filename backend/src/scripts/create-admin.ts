/**
 * Script to create admin user
 * Run: npx tsx src/scripts/create-admin.ts
 */

import bcrypt from 'bcryptjs';
import pool from '../database/connection';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('Creating admin user...\n');

    const email = await question('Email: ');
    const name = await question('Name: ');
    const password = await question('Password: ');

    if (!email || !name || !password) {
      console.error('All fields are required!');
      process.exit(1);
    }

    // Check if admin exists
    const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.error('Admin user with this email already exists!');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'super_admin')
       RETURNING id, email, name`,
      [email, passwordHash, name]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Name: ${result.rows[0].name}`);

    rl.close();
    process.exit(0);
  } catch (error: any) {
    console.error('Error creating admin:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();


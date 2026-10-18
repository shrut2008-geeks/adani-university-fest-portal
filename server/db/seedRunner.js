const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('./index');

async function runSeed() {
  console.log('🔄 Initializing AU Fest Database...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const seedPath = path.join(__dirname, 'seed.sql');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('📋 Running schema.sql...');
    await client.query(schemaSql);
    console.log('✅ Schema tables created successfully.');

    console.log('🌱 Running seed.sql...');
    await client.query(seedSql);
    console.log('✅ Base seed data inserted successfully!');

    // Read admin and club admin passwords from server/.env and hash with bcrypt
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;
    const clubAdminPassword = process.env.CLUBADMIN_SEED_PASSWORD;

    if (!adminPassword || !clubAdminPassword) {
      console.warn('⚠️ Warning: ADMIN_SEED_PASSWORD and/or CLUBADMIN_SEED_PASSWORD not defined in server/.env');
      console.warn('   Admin and Club Admin accounts have uninitialized passwords.');
    } else {
      console.log('🔒 Hashing privileged accounts with bcrypt from server/.env...');
      const salt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash(adminPassword, salt);
      const clubAdminHash = await bcrypt.hash(clubAdminPassword, salt);

      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [adminHash, 'admin@adani.ac.in']
      );
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [clubAdminHash, 'clubadmin@adani.ac.in']
      );
      console.log('✅ Admin and Club Admin passwords hashed and set successfully.');
    }

    console.log('\nDefault Accounts seeded:');
    console.log(' - Admin: admin@adani.ac.in (password configured in server/.env via ADMIN_SEED_PASSWORD)');
    console.log(' - Club Admin: clubadmin@adani.ac.in (password configured in server/.env via CLUBADMIN_SEED_PASSWORD)');
    console.log(' - Student: student@adani.ac.in (pass: adani123)');
  } catch (err) {
    console.error('❌ Error applying schema or seed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();

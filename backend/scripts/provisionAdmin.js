#!/usr/bin/env node
/**
 * SkillBridge AI - Secure CLI Admin Provisioning Tool
 *
 * Usage:
 *   node backend/scripts/provisionAdmin.js
 *   ADMIN_EMAIL="admin@univ.edu" ADMIN_PASSWORD="SecurePassword@123" ADMIN_NAME="Dean Sharma" node backend/scripts/provisionAdmin.js
 *
 * Requirements:
 * - Script must run locally from backend environment.
 * - Accepts input via environment variables or interactive CLI prompt (with hidden password input).
 * - Hashes password using User.hashPassword (bcryptjs).
 * - Never stores or logs plaintext passwords.
 * - Sets role to UNIVERSITY_ADMIN with isVerified=true.
 * - Prevents duplicate admin accounts.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const readline = require('readline');
const mongoose = require('mongoose');
const { User } = require('../src/models');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge_ai';

function askQuestion(query, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden) {
      process.stdout.write(query);
      let input = '';
      const onData = (char) => {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            process.stdin.pause();
            break;
          case '\u0003':
            process.exit(1);
            break;
          case '\u0008':
          case '\x7f':
            if (input.length > 0) {
              input = input.slice(0, -1);
            }
            break;
          default:
            input += char;
            break;
        }
      };

      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', onData);
        rl.on('close', () => {
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          resolve(input.trim());
        });
      } else {
        // Fallback for non-TTY
        rl.question('', (ans) => {
          rl.close();
          resolve(ans.trim());
        });
      }
    } else {
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

async function provisionAdmin({ name, email, password, university } = {}) {
  if (!email || !password) {
    throw new Error('Email and password are required to provision an admin.');
  }

  if (password.length < 8) {
    throw new Error('Admin password must be at least 8 characters long for security.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error(`Account already exists with email: ${normalizedEmail} (Role: ${existingUser.role}). Duplicate admin creation rejected.`);
  }

  const passwordHash = await User.hashPassword(password);

  const adminUniversity = (university || process.env.ADMIN_UNIVERSITY || 'SkillBridge University').trim();

  const adminUser = await User.create({
    name: (name || 'University Administrator').trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'UNIVERSITY_ADMIN',
    university: adminUniversity,
    isVerified: true,
    status: 'ACTIVE',
  });

  return {
    id: adminUser._id,
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
    isVerified: adminUser.isVerified,
    status: adminUser.status,
  };
}

async function main() {
  console.log('====================================================');
  console.log('   SKILLBRIDGE AI — SECURE ADMIN PROVISIONING CLI    ');
  console.log('====================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[INFO] Connected to MongoDB database securely.\n');

    let adminName = process.env.ADMIN_NAME || 'University Administrator';
    let adminEmail = process.env.ADMIN_EMAIL;
    let adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail) {
      adminEmail = await askQuestion('Enter Admin Email Address: ');
    }
    if (process.env.ADMIN_NAME === undefined && !process.env.ADMIN_EMAIL) {
      const promptedName = await askQuestion('Enter Admin Full Name (Default: University Administrator): ');
      if (promptedName) adminName = promptedName;
    }
    if (!adminPassword) {
      adminPassword = await askQuestion('Enter Admin Password (hidden, min 8 chars): ', true);
    }

    console.log('\n[INFO] Validating and hashing admin credentials...');
    const createdAdmin = await provisionAdmin({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
    });

    console.log('\n[SUCCESS] UNIVERSITY_ADMIN successfully provisioned!');
    console.log(`  - User ID:     ${createdAdmin.id}`);
    console.log(`  - Name:        ${createdAdmin.name}`);
    console.log(`  - Email:       ${createdAdmin.email}`);
    console.log(`  - Role:        ${createdAdmin.role}`);
    console.log(`  - Verified:    ${createdAdmin.isVerified}`);
    console.log(`  - Status:      ${createdAdmin.status}`);
    console.log('\n[SECURITY NOTE] Plaintext password was not saved, logged, or exposed.\n');
  } catch (err) {
    console.error('\n[ERROR] Admin Provisioning Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('[INFO] Disconnected from MongoDB.\n');
  }
}

if (require.main === module) {
  main();
}

module.exports = { provisionAdmin };

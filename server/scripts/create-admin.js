import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/db.js';
import { isValidEmail, isStrongPassword, sanitizeInput } from '../src/utils/sanitize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name') out.name = args[++i];
    else if (args[i] === '--email') out.email = args[++i];
    else if (args[i] === '--password') out.password = args[++i];
  }
  return out;
}

async function main() {
  const cli = parseArgs();
  const name = sanitizeInput(cli.name || process.env.SETUP_ADMIN_NAME || '');
  const email = sanitizeInput((cli.email || process.env.SETUP_ADMIN_EMAIL || '').toLowerCase());
  const password = cli.password || process.env.SETUP_ADMIN_PASSWORD || '';

  if (!name || !email || !password) {
    console.log(`
Create an administrator account in MySQL.

Usage:
  npm run admin:create -- --name "Your Name" --email admin@school.edu --password "SecurePass123!"

Or set in server/.env:
  SETUP_ADMIN_NAME=...
  SETUP_ADMIN_EMAIL=...
  SETUP_ADMIN_PASSWORD=...
`);
    process.exit(1);
  }

  if (!isValidEmail(email)) {
    console.error('Invalid email address.');
    process.exit(1);
  }
  if (!isStrongPassword(password)) {
    console.error('Password must be 8+ characters with uppercase, lowercase, and a number.');
    process.exit(1);
  }

  const existing = await query('SELECT id, role FROM users WHERE email = ?', [email]);
  if (existing.length) {
    console.error(`User already exists: ${email} (${existing[0].role})`);
    process.exit(1);
  }

  const role = 'admin';

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'active')`,
    [id, name, email, passwordHash, role]
  );

  console.log(`Administrator created successfully.`);
  console.log(`  Email: ${email}`);
  console.log(`  Role:  ${role}`);
  console.log(`\nSign in at http://localhost:8080`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

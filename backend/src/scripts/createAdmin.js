import 'dotenv/config';
import bcrypt from 'bcryptjs';
import * as userRepository from '../repositories/userRepository.js';

const SALT_ROUNDS = 12;

async function createAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Admin';

    if (!email || !password) {
        console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment variables.');
        process.exit(1);
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
        console.log('Admin user already exists.');
        process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await userRepository.create({email, passwordHash, name, role: 'admin'});
    console.log(`Admin user created: ${admin.email} (user_id ${admin.user_id})`);
    process.exit(0);
}

createAdmin().catch(err => {
    console.error('Error creating admin user:', err);
    process.exit(1);
});
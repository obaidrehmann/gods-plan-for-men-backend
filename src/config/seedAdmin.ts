import { User } from '../models/User';

export const DEFAULT_ADMIN = {
  name: 'Admin',
  email: 'admin@admin.com',
  password: 'admin@123',
} as const;

export async function seedAdminUser(): Promise<void> {
  const email = DEFAULT_ADMIN.email.toLowerCase();
  const existing = await User.findOne({ email });

  if (!existing) {
    await User.create({
      name: DEFAULT_ADMIN.name,
      email,
      password: DEFAULT_ADMIN.password,
      role: 'admin',
      isActive: true,
    });
    console.log(`Admin user created (${DEFAULT_ADMIN.email})`);
    return;
  }

  existing.name = DEFAULT_ADMIN.name;
  existing.role = 'admin';
  existing.isActive = true;
  existing.password = DEFAULT_ADMIN.password;
  await existing.save();

  console.log(`Admin user ensured (${DEFAULT_ADMIN.email})`);
}

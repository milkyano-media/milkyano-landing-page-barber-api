// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  // Clear existing data
  await prisma.user.deleteMany({});
  
  console.log('Seeding database...');

  // Hash password for admin user
  const hashedAdminPassword = await bcrypt.hash('admin', SALT_ROUNDS);

  // Create sample admin user
  const admin = await prisma.user.create({
    data: {
      phoneNumber: '+61400000001',
      email: 'admin@milkyano.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      password: hashedAdminPassword,
      isVerified: true
    }
  });

  console.log(`Created admin user: ${admin.email} (password: admin)`);

  // Create sample customer users
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        phoneNumber: '+61400000002',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        isVerified: true
      }
    }),
    prisma.user.create({
      data: {
        phoneNumber: '+61400000003',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'CUSTOMER',
        isVerified: true
      }
    }),
    prisma.user.create({
      data: {
        phoneNumber: '+61400000004',
        firstName: 'Bob',
        lastName: 'Wilson',
        role: 'CUSTOMER',
        isVerified: false // Unverified customer without email
      }
    })
  ]);
  
  console.log(`Created ${customers.length} sample customers`);

  // Clear existing parameters
  await prisma.parameter.deleteMany({});

  // Create Phase 1 parameters
  const parameters = await Promise.all([
    // Feature flags
    prisma.parameter.create({
      data: {
        key: 'feature.booking_enabled',
        value: true,
        type: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Master switch for booking system',
        isActive: true
      }
    }),
    prisma.parameter.create({
      data: {
        key: 'feature.google_oauth_enabled',
        value: true,
        type: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Enable Google sign-in',
        isActive: true
      }
    }),
    prisma.parameter.create({
      data: {
        key: 'feature.apple_oauth_enabled',
        value: true,
        type: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Enable Apple sign-in',
        isActive: true
      }
    }),
    prisma.parameter.create({
      data: {
        key: 'feature.phone_verification_enabled',
        value: true,
        type: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Require phone verification via OTP',
        isActive: true
      }
    }),
    prisma.parameter.create({
      data: {
        key: 'feature.promotional_banner_enabled',
        value: false,
        type: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Show promotional banner on homepage',
        isActive: true
      }
    }),
    // Content parameters
    prisma.parameter.create({
      data: {
        key: 'content.homepage_hero_title',
        value: 'Book Your Perfect Cut',
        type: 'STRING',
        category: 'CONTENT',
        description: 'Main homepage headline',
        isActive: true
      }
    }),
    prisma.parameter.create({
      data: {
        key: 'content.homepage_hero_subtitle',
        value: 'Expert barbers, premium service, unbeatable style',
        type: 'STRING',
        category: 'CONTENT',
        description: 'Homepage subheadline',
        isActive: true
      }
    }),
    prisma.parameter.create({
      data: {
        key: 'content.cta_primary_text',
        value: 'Book Now',
        type: 'STRING',
        category: 'CONTENT',
        description: 'Primary call-to-action button text',
        isActive: true
      }
    }),
    prisma.parameter.create({
      data: {
        key: 'content.promotional_message',
        value: '',
        type: 'STRING',
        category: 'CONTENT',
        description: 'Rotating promotional banner message',
        isActive: true
      }
    }),
    prisma.parameter.create({
      data: {
        key: 'content.emergency_message',
        value: '',
        type: 'STRING',
        category: 'CONTENT',
        description: 'Urgent announcements (closures, etc.)',
        isActive: true
      }
    }),
    // Theme parameter
    prisma.parameter.create({
      data: {
        key: 'theme.primary_color',
        value: '#33FF00',
        type: 'COLOR',
        category: 'THEME',
        description: 'Brand primary color (that distinctive green)',
        isActive: true
      }
    })
  ]);

  console.log(`Created ${parameters.length} Phase 1 parameters`);

  console.log('Database seeding completed!');
  console.log('\nNote: These are sample users. In production, users will be created via OTP verification.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

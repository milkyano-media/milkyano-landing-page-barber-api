// prisma/seed.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.user.deleteMany({});
  
  console.log('Seeding database...');

  // Create sample admin user
  const admin = await prisma.user.create({
    data: {
      phoneNumber: '+61400000001',
      email: 'admin@milkyano.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isVerified: true
    }
  });
  
  console.log(`Created admin user: ${admin.email}`);

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

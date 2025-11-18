import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Barber data from the current implementation
const barbers = [
    {
        name: 'amir',
        displayName: 'Amir',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/amir.png',
        redirectUrl: '/amir',
        hasLanding: true,
        sortOrder: 0,
    },
    {
        name: 'rayhan',
        displayName: 'Rayhan',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/rayhan.png',
        redirectUrl: '/rayhan',
        hasLanding: true,
        sortOrder: 1,
    },
    {
        name: 'anthony',
        displayName: 'Anthony',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/anthony.png',
        redirectUrl: '/anthony',
        hasLanding: true,
        sortOrder: 2,
    },
    {
        name: 'josh',
        displayName: 'Josh',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/josh.png',
        redirectUrl: '/josh',
        hasLanding: true,
        sortOrder: 3,
    },
    {
        name: 'noah',
        displayName: 'Noah',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/noah.png',
        redirectUrl: '/noah',
        hasLanding: true,
        sortOrder: 4,
    },
    {
        name: 'jay',
        displayName: 'Jay',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/jay.png',
        redirectUrl: '/jay',
        hasLanding: true,
        sortOrder: 5,
    },
    {
        name: 'wyatt',
        displayName: 'Wyatt',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/wyatt-swick.png',
        redirectUrl: '/wyatt',
        hasLanding: true,
        sortOrder: 6,
    },
    {
        name: 'emman',
        displayName: 'Emman',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/emman.png',
        redirectUrl: '/emman',
        hasLanding: true,
        sortOrder: 7,
    },
    {
        name: 'christos',
        displayName: 'Christos',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/christos.png',
        redirectUrl: '/christos',
        hasLanding: true,
        sortOrder: 8,
    },
    {
        name: 'niko',
        displayName: 'Niko',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/niko.png',
        redirectUrl: '/niko',
        hasLanding: true,
        sortOrder: 9,
    },
    {
        name: 'dejan',
        displayName: 'Dejan',
        imageUrl: 'https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/dejan.png',
        redirectUrl: '/book/services',
        hasLanding: false,
        sortOrder: 10,
    },
];

/**
 * Convert image URL to base64 data URL
 * @param {string} url - Image URL
 * @returns {Promise<string>} Base64 data URL
 */
async function imageUrlToBase64(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
        });

        const contentType = response.headers['content-type'];
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error(`Failed to fetch image from ${url}:`, error.message);
        throw error;
    }
}

/**
 * Seed barbers into database
 */
async function seedBarbers() {
    console.log('Starting barber seed...');

    try {
        // Check if barbers already exist
        const existingBarbers = await prisma.barber.findMany();
        if (existingBarbers.length > 0) {
            console.log(`Found ${existingBarbers.length} existing barbers. Skipping seed.`);
            console.log('If you want to re-seed, delete existing barbers first.');
            return;
        }

        console.log('Fetching and converting images to base64...');

        // Process each barber
        for (const barber of barbers) {
            console.log(`Processing ${barber.displayName}...`);

            try {
                // Fetch and convert image to base64
                const imageBase64 = await imageUrlToBase64(barber.imageUrl);

                // Create barber in database
                await prisma.barber.create({
                    data: {
                        name: barber.name,
                        displayName: barber.displayName,
                        imageBase64,
                        redirectUrl: barber.redirectUrl,
                        hasLanding: barber.hasLanding,
                        isActive: true,
                        sortOrder: barber.sortOrder,
                    },
                });

                console.log(`✓ Created ${barber.displayName}`);
            } catch (error) {
                console.error(`✗ Failed to create ${barber.displayName}:`, error.message);
                // Continue with next barber instead of failing entirely
            }
        }

        console.log('\n✓ Barber seed completed successfully!');

        // Display summary
        const totalBarbers = await prisma.barber.count();
        console.log(`Total barbers in database: ${totalBarbers}`);

    } catch (error) {
        console.error('Error during seed:', error);
        throw error;
    }
}

// Run seed
seedBarbers()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

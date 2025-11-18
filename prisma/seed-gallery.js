import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Gallery images from S3
const galleryData = [
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/1.png",
        alt: "High Skin Fade by Josh",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/2.png",
        alt: "High Skin Fade by Josh",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/3.png",
        alt: "High Skin Fade by Emman",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/4.png",
        alt: "Low Taper by Emman",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/5.png",
        alt: "Mid to High Burst Fade by Emman",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/6.png",
        alt: "High Drop Fade by Emman",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/7.png",
        alt: "Mid to High by Josh",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/8.png",
        alt: "High Skin Fade by Christos",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/9.png",
        alt: "Burst Fade by Emman",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/10.png",
        alt: "High Skin Fade by Christos",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/11.png",
        alt: "High Taper Fade by Christos",
    },
    {
        url: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/gallery/12.png",
        alt: "Low Drop Fade by Christos",
    },
];

/**
 * Convert image URL to base64
 */
async function convertUrlToBase64(url) {
    try {
        console.log(`Downloading image from: ${url}`);

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30 second timeout
        });

        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        const contentType = response.headers['content-type'] || 'image/png';

        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error(`Error downloading ${url}:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('Starting gallery seed...');

    // Clear existing gallery items
    await prisma.galleryItem.deleteMany({});
    console.log('Cleared existing gallery items');

    // Process each image
    for (let i = 0; i < galleryData.length; i++) {
        const { url, alt } = galleryData[i];

        try {
            console.log(`\nProcessing ${i + 1}/${galleryData.length}: ${alt}`);

            // Download and convert to base64
            const imageBase64 = await convertUrlToBase64(url);

            // Create gallery item
            const galleryItem = await prisma.galleryItem.create({
                data: {
                    title: alt,
                    description: `Gallery image: ${alt}`,
                    imageBase64,
                    isActive: true,
                    sortOrder: i
                }
            });

            console.log(`✓ Created gallery item: ${galleryItem.title} (${galleryItem.id})`);
        } catch (error) {
            console.error(`✗ Failed to process ${alt}:`, error.message);
            // Continue with next image instead of stopping
        }
    }

    const count = await prisma.galleryItem.count();
    console.log(`\n✓ Gallery seeding completed! Created ${count} gallery items.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

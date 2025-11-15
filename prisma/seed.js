// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    // Clear existing data
    await prisma.user.deleteMany({});

    console.log("Seeding database...");

    // Hash password for admin user
    const hashedAdminPassword = await bcrypt.hash("admin", SALT_ROUNDS);

    // Create sample admin user
    const admin = await prisma.user.create({
        data: {
            phoneNumber: "+61400000001",
            email: "admin@milkyano.com",
            firstName: "Admin",
            lastName: "User",
            role: "ADMIN",
            password: hashedAdminPassword,
            isVerified: true,
        },
    });

    console.log(`Created admin user: ${admin.email} (password: admin)`);

    // Create sample customer users
    const customers = await Promise.all([
        prisma.user.create({
            data: {
                phoneNumber: "+61400000002",
                email: "john.doe@example.com",
                firstName: "John",
                lastName: "Doe",
                role: "CUSTOMER",
                isVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                phoneNumber: "+61400000003",
                email: "jane.smith@example.com",
                firstName: "Jane",
                lastName: "Smith",
                role: "CUSTOMER",
                isVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                phoneNumber: "+61400000004",
                firstName: "Bob",
                lastName: "Wilson",
                role: "CUSTOMER",
                isVerified: false, // Unverified customer without email
            },
        }),
    ]);

    console.log(`Created ${customers.length} sample customers`);

    // Clear existing parameters
    await prisma.parameter.deleteMany({});

    // Create Phase 1 parameters
    const parameters = await Promise.all([
        // Feature flags
        prisma.parameter.create({
            data: {
                key: "feature.booking_enabled",
                value: "true",
                type: "BOOLEAN",
                category: "FEATURE_FLAG",
                description: "Master switch for booking system",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "feature.promotional_banner_enabled",
                value: "false",
                type: "BOOLEAN",
                category: "FEATURE_FLAG",
                description: "Show promotional banner on homepage",
                isActive: false,
            },
        }),
        // Content parameters
        prisma.parameter.create({
            data: {
                key: "content.homepage_hero_title",
                value: "Book Your Perfect Cut",
                type: "STRING",
                category: "CONTENT",
                description: "Main homepage headline",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.homepage_hero_subtitle",
                value: "Expert barbers, premium service, unbeatable style",
                type: "STRING",
                category: "CONTENT",
                description: "Homepage subheadline",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.cta_primary_text",
                value: "Book Now",
                type: "STRING",
                category: "CONTENT",
                description: "Primary call-to-action button text",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.promotional_message",
                value: "",
                type: "STRING",
                category: "CONTENT",
                description: "Rotating promotional banner message",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.emergency_message",
                value: "",
                type: "STRING",
                category: "CONTENT",
                description: "Urgent announcements (closures, etc.)",
                isActive: false,
            },
        }),
        // Theme parameter
        prisma.parameter.create({
            data: {
                key: "theme.primary_color",
                value: "#33FF00",
                type: "COLOR",
                category: "THEME",
                description: "Brand primary color (that distinctive green)",
                isActive: false,
            },
        }),
        // Phase 2: Additional Theme Colors
        prisma.parameter.create({
            data: {
                key: "theme.background_color",
                value: "#000000",
                type: "COLOR",
                category: "THEME",
                description: "Main background color",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "theme.border_color",
                value: "#292524",
                type: "COLOR",
                category: "THEME",
                description: "Border color (stone-800)",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "theme.text_color_primary",
                value: "#ffffff",
                type: "COLOR",
                category: "THEME",
                description: "Primary text color",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "theme.text_color_secondary",
                value: "#a8a29e",
                type: "COLOR",
                category: "THEME",
                description: "Secondary text color (gray-400)",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "theme.shadow_color",
                value: "#33ff00",
                type: "COLOR",
                category: "THEME",
                description: "The subtle shadow",
                isActive: false,
            },
        }),
        // Phase 2: Additional Content Parameters
        prisma.parameter.create({
            data: {
                key: "content.booking_success_title",
                value: "Thanks For Booking",
                type: "STRING",
                category: "CONTENT",
                description: "Booking confirmation page title",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.booking_success_message",
                value: "Your Appointment is Coming Up",
                type: "STRING",
                category: "CONTENT",
                description: "Booking confirmation page message",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.about_us_headline",
                value: "About Fadedlines",
                type: "STRING",
                category: "CONTENT",
                description: "About page main headline",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.footer_tagline",
                value: "Your style, our passion",
                type: "STRING",
                category: "CONTENT",
                description: "Footer tagline/slogan",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.cut_gallery",
                value: JSON.stringify([
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
                ]),
                type: "JSON",
                category: "CONTENT",
                description: "Show off your cuts",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.barber_list",
                value: JSON.stringify([
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/amir.png",
                        link: "/amir",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/rayhan.png",
                        link: "/rayhan",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/anthony.png",
                        link: "/anthony",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/josh.png",
                        link: "/josh",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/noah.png",
                        link: "/noah",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/jay.png",
                        link: "/jay",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/wyatt-swick.png",
                        link: "/wyatt",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/emman.png",
                        link: "/emman",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/christos.png",
                        link: "/christos",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/niko.png",
                        link: "/niko",
                        landing: false,
                    },
                    {
                        imageUrl: "https://s3.milkyano.com/milkyano/fadedlines-oakleigh/barbers/dejan.png",
                        link: "/dejan",
                        landing: false,
                    },
                ]),
                type: "JSON",
                category: "CONTENT",
                description: "List all the barber on barbers page",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.faqs",
                value: JSON.stringify([
                    {
                        question: "What services do you offer?",
                        answer: `We specialize in all types of hair textures and offer men's haircuts starting from $50, and haircut & beard trims starting from $75 (depending on your chosen barber). We provide traditional styled & dapper haircuts, smooth razor shaves, and close fades in a clean & safe environment.`,
                    },
                    {
                        question: "Where are you located and how can I contact you?",
                        answer: `We're located at 55 Portman St, Oakleigh VIC 3166, Australia. You can contact us via phone at +6135 249 543, email us at dejan@fadedlinesbarbershop.com, or follow us on Instagram @fadedlinesbarbershop for updates and our latest work.`,
                    },
                    {
                        question: "Do you accept walk-ins or appointments only?",
                        answer: `Faded Lines Barbershop offers both appointments and walk-ins to bring convenience back into people's lives. We recommend booking an appointment for guaranteed service times, but we also welcome walk-ins based on availability. Our pricing is determined by demand and the experience level of your chosen barber.`,
                    },
                    {
                        question: "What makes Faded Lines Barbershop special?",
                        answer: `We're an award-winning barbershop that provides great services at a professional standard. Our team is committed to making clients feel welcome in a clean & safe environment. We've served over 5000+ happy customers and are well-known on TikTok for our quality work. Our goal is to ensure you leave feeling confident with every visit.`,
                    },
                ]),
                type: "JSON",
                category: "CONTENT",
                description: "Frequently Asked Questions",
                isActive: false,
            },
        }),
        // Phase 2: Branding Parameters
        prisma.parameter.create({
            data: {
                key: "branding.company_name",
                value: "Milkyano Barber",
                type: "STRING",
                category: "BRANDING",
                description: "Company name",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "branding.company_tagline",
                value: "Premium Barbershop Experience",
                type: "STRING",
                category: "BRANDING",
                description: "Main company tagline",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "branding.logo",
                value: "",
                type: "BASE64",
                category: "BRANDING",
                description: "Main logo (base64 encoded image)",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "branding.logo_dark",
                value: "",
                type: "BASE64",
                category: "BRANDING",
                description: "Dark mode logo (base64 encoded image)",
                isActive: false,
            },
        }),
        // Contact parameters (Phase 3.1)
        prisma.parameter.create({
            data: {
                key: "contact.phone_number",
                value: "+61 XXX XXX XXX",
                type: "STRING",
                category: "CONTACT",
                description: "Main business phone number",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.email",
                value: "info@fadedlines.com",
                type: "STRING",
                category: "CONTACT",
                description: "Primary contact email",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.address",
                value: "123 Barber Street, Melbourne VIC 3000",
                type: "STRING",
                category: "CONTACT",
                description: "Physical business address",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.business_hours",
                value: JSON.stringify({
                    "Monday-Friday": "9:00 AM - 6:00 PM",
                    Saturday: "10:00 AM - 4:00 PM",
                    Sunday: "Closed",
                }),
                type: "JSON",
                category: "CONTACT",
                description: "Operating hours by day",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.google_maps_url",
                value: "https://maps.google.com/?q=fadedlines+barber",
                type: "URL",
                category: "CONTACT",
                description: "Google Maps location link",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.instagram_url",
                value: "https://instagram.com/fadedlines",
                type: "URL",
                category: "CONTACT",
                description: "Instagram profile URL",
                isActive: false,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.facebook_url",
                value: "https://facebook.com/fadedlines",
                type: "URL",
                category: "CONTACT",
                description: "Facebook page URL",
                isActive: false,
            },
        }),
    ]);

    console.log(`Created ${parameters.length} parameters (Phase 1 + Phase 2 + Phase 3.1)`);

    console.log("Database seeding completed!");
    console.log("\nNote: These are sample users. In production, users will be created via OTP verification.");
}

main()
    .catch((e) => {
        console.error("Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

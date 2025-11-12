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
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "feature.promotional_banner_enabled",
                value: "false",
                type: "BOOLEAN",
                category: "FEATURE_FLAG",
                description: "Show promotional banner on homepage",
                isActive: true,
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
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.homepage_hero_subtitle",
                value: "Expert barbers, premium service, unbeatable style",
                type: "STRING",
                category: "CONTENT",
                description: "Homepage subheadline",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.cta_primary_text",
                value: "Book Now",
                type: "STRING",
                category: "CONTENT",
                description: "Primary call-to-action button text",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.promotional_message",
                value: "",
                type: "STRING",
                category: "CONTENT",
                description: "Rotating promotional banner message",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.emergency_message",
                value: "",
                type: "STRING",
                category: "CONTENT",
                description: "Urgent announcements (closures, etc.)",
                isActive: true,
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
                isActive: true,
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
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "theme.border_color",
                value: "#292524",
                type: "COLOR",
                category: "THEME",
                description: "Border color (stone-800)",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "theme.text_color_primary",
                value: "#ffffff",
                type: "COLOR",
                category: "THEME",
                description: "Primary text color",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "theme.text_color_secondary",
                value: "#a8a29e",
                type: "COLOR",
                category: "THEME",
                description: "Secondary text color (gray-400)",
                isActive: true,
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
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.booking_success_message",
                value: "Your Appointment is Coming Up",
                type: "STRING",
                category: "CONTENT",
                description: "Booking confirmation page message",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.about_us_headline",
                value: "About Fadedlines",
                type: "STRING",
                category: "CONTENT",
                description: "About page main headline",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "content.footer_tagline",
                value: "Your style, our passion",
                type: "STRING",
                category: "CONTENT",
                description: "Footer tagline/slogan",
                isActive: true,
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
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "branding.company_tagline",
                value: "Premium Barbershop Experience",
                type: "STRING",
                category: "BRANDING",
                description: "Main company tagline",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "branding.logo",
                value: "",
                type: "BASE64",
                category: "BRANDING",
                description: "Main logo (base64 encoded image)",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "branding.logo_dark",
                value: "",
                type: "BASE64",
                category: "BRANDING",
                description: "Dark mode logo (base64 encoded image)",
                isActive: true,
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
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.email",
                value: "info@fadedlines.com",
                type: "STRING",
                category: "CONTACT",
                description: "Primary contact email",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.address",
                value: "123 Barber Street, Melbourne VIC 3000",
                type: "STRING",
                category: "CONTACT",
                description: "Physical business address",
                isActive: true,
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
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.google_maps_url",
                value: "https://maps.google.com/?q=fadedlines+barber",
                type: "URL",
                category: "CONTACT",
                description: "Google Maps location link",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.instagram_url",
                value: "https://instagram.com/fadedlines",
                type: "URL",
                category: "CONTACT",
                description: "Instagram profile URL",
                isActive: true,
            },
        }),
        prisma.parameter.create({
            data: {
                key: "contact.facebook_url",
                value: "https://facebook.com/fadedlines",
                type: "URL",
                category: "CONTACT",
                description: "Facebook page URL",
                isActive: true,
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

from django.core.management.base import BaseCommand
from django.utils.text import slugify
from services.models import Category


class Command(BaseCommand):
    help = 'Seed all 140 service provider categories'

    def handle(self, *args, **kwargs):
        categories = [
            # Home Repairs & Maintenance
            "Electrician",
            "Plumber",
            "Carpenter",
            "Welder",
            "Painter",
            "POP Ceiling Installer",
            "Tiler",
            "Bricklayer/Mason",
            "Roofer",
            "Aluminum Installer",
            "Glass Installer/Glazier",
            "Borehole Technician",
            "Water Treatment Technician",
            "Generator Technician",
            "Inverter Technician",
            "Solar Panel Installer",
            "CCTV Installer",
            "Intercom Installer",
            "Gate Automation Technician",
            "Locksmith",

            # Appliance & Electronics
            "Phone Technician",
            "Laptop Technician",
            "TV Repair Technician",
            "Refrigerator Technician",
            "Washing Machine Technician",
            "Microwave Repair Technician",
            "Air Conditioner Technician",
            "Freezer Technician",
            "Gas Cooker Technician",
            "Home Appliance Installer",

            # Cleaning & Sanitation
            "Home Cleaner",
            "Office Cleaner",
            "Janitor",
            "Laundry Service",
            "Dry Cleaner",
            "Fumigation/Pest Control",
            "Waste Disposal Service",
            "Septic Tank Evacuation",
            "Swimming Pool Cleaner",
            "Water Tank Cleaner",

            # Beauty & Personal Care
            "Barber",
            "Hair Stylist",
            "Makeup Artist",
            "Nail Technician",
            "Lash Technician",
            "Spa Therapist",
            "Massage Therapist",
            "Tattoo Artist",
            "Piercing Specialist",
            "Skincare Specialist",

            # Fashion
            "Tailor",
            "Fashion Designer",
            "Shoe Maker",
            "Shoe Repairer",
            "Bag Maker",
            "Leather Craftsman",
            "Embroidery Specialist",
            "Fabric Seller",
            "Bead Maker",
            "Jewelry Designer",

            # Automotive
            "Auto Mechanic",
            "Auto Electrician",
            "Panel Beater",
            "Car Painter",
            "Car Wash Service",
            "Car Detailer",
            "Tire Technician",
            "Vulcanizer",
            "Vehicle Diagnostic Technician",
            "Car Towing Service",

            # Construction
            "Architect",
            "Quantity Surveyor",
            "Civil Engineer",
            "Building Contractor",
            "Interior Designer",
            "Furniture Maker",
            "Kitchen Cabinet Installer",
            "Curtain Installer",
            "Wallpaper Installer",
            "Land Surveyor",

            # Technology
            "Web Developer",
            "Mobile App Developer",
            "Graphic Designer",
            "UI/UX Designer",
            "Cybersecurity Specialist",
            "Network Engineer",
            "CCTV Network Technician",
            "Data Analyst",
            "IT Support Specialist",
            "Computer Trainer",

            # Education
            "Home Tutor",
            "Music Teacher",
            "Language Tutor",
            "Coding Instructor",
            "WAEC/JAMB Tutor",

            # Events
            "Photographer",
            "Videographer",
            "Event Planner",
            "MC (Master of Ceremony)",
            "DJ",
            "Caterer",
            "Baker",
            "Decorator",
            "Live Band",
            "Event Usher",

            # Health & Wellness
            "Physiotherapist",
            "Fitness Trainer",
            "Yoga Instructor",
            "Dietitian",
            "Home Caregiver",

            # Logistics
            "Courier Rider",
            "Delivery Driver",
            "House Movers",
            "Packing Service",
            "Dispatch Rider",

            # Business Services
            "Accountant",
            "Lawyer",
            "Notary/Public Documentation",
            "Business Consultant",
            "Tax Consultant",

            # Agriculture
            "Gardener",
            "Landscaper",
            "Florist",
            "Poultry Consultant",
            "Farm Equipment Technician",

            # Security
            "Private Security Guard",
            "Bouncer",
            "Bodyguard",
            "Security Systems Installer",
            "Fire Safety Technician",

            # Miscellaneous
            "Pet Groomer",
            "Pet Trainer",
            "Housekeeper",
            "Personal Shopper",
            "Personal Assistant",
            "Translator",
            "Voice-over Artist",
            "Printing Service",
            "Signage Installer",
            "Drone Operator",
        ]

        created_count = 0
        existing_count = 0

        for name in categories:
            slug = slugify(name)
            obj, created = Category.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'is_active': True
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created: {name}'))
            else:
                existing_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! Created: {created_count} | Already existed: {existing_count}'
        ))
import type {
  BlogCategory,
  BlogPost,
  GalleryImageItem,
  ReviewItem,
  WebsiteSettings,
} from '../types';
import {
  IMG_BATTERY,
  IMG_DISPLAY,
  IMG_HERO_PRO,
  IMG_KEYBOARD,
  IMG_LIQUID,
  IMG_MACOS,
  IMG_MICROSCOPE,
  IMG_THERMAL,
  IMG_USBC,
  IMG_WORKSHOP,
} from './seedServicesAndModels';

export const DEFAULT_WEBSITE_SETTINGS: Omit<WebsiteSettings, 'updatedAt'> = {
  businessName: 'Refix Pro',
  tagline: 'Dedicated Apple MacBook, iPad & iPhone Repair Specialist in Gurugram',
  phone: '+91 96139 32932',
  whatsapp: '+91 96139 32932',
  email: 'refixpro.in@gmail.com',
  websiteUrl: 'https://refixpro.in',
  address: 'SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007',
  businessHours: 'Open Daily · 10:30 AM – 9:00 PM',
  googleRating: 4.7,
  googleReviewCount: 45,
  googlePlaceId: '',
  googleReviewsUrl: 'https://www.google.com/maps/search/?api=1&query=SCF-92,SECTOR-14+MAIN+MARKET,+Gurugram,+Haryana+122007',
  logoUrl: '',
  heroHeadline: 'Expert MacBook Repair in Gurugram',
  heroSubheadline:
    'From liquid damage and motherboard faults to screen replacement and battery issues, get professional MacBook repair solutions at Refix Pro — plus precision support for Apple iPad and iPhone models.',
  heroImageUrl: IMG_HERO_PRO,
  heroSlides: [
    {
      id: 'slide-1',
      title: 'ESD-Safe MacBook Diagnostic Studio',
      subtitle: 'Precision logic board & Retina display service at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
      imageUrl: IMG_HERO_PRO,
    },
    {
      id: 'slide-2',
      title: 'Leica Microscope & Chip-Level Rework',
      subtitle: 'Power rail short isolation, USB-C controller ICs, and liquid spill recovery.',
      imageUrl: IMG_MICROSCOPE,
    },
    {
      id: 'slide-3',
      title: 'Retina & Liquid Retina XDR Calibration',
      subtitle: 'Panel swaps, eDP flex inspection, and backlight boost circuit repair.',
      imageUrl: IMG_DISPLAY,
    },
    {
      id: 'slide-4',
      title: 'Dedicated Apple Hardware Workbench',
      subtitle: 'Structured intake, upfront inspection quotes, and genuine care for your MacBook.',
      imageUrl: IMG_WORKSHOP,
    },
  ],
  headerCtaText: 'Book a Repair',
  headerCtaUrl: '/book',
  navLinks: [
    { label: 'Home', to: '/', visible: true },
    { label: 'Services', to: '/services', visible: true },
    { label: 'Models', to: '/models', visible: true },
    { label: 'Track Repair', to: '/track', visible: true },
    { label: 'About', to: '/about', visible: true },
    { label: 'Blog', to: '/blog', visible: true },
    { label: 'Contact', to: '/contact', visible: true },
  ],
  footerDescription:
    'Dedicated Apple MacBook diagnostic and chip-level repair studio at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. Transparent inspection, micro-soldering expertise, and genuine care for your MacBook, iPad, and iPhone.',
  footerTagline: 'Your MacBook Deserves Expert Care. Trust Refix Pro.',
  footerLegalText:
    'Refix Pro is an independent Apple device repair studio at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 and is not affiliated with or an Apple Authorized Service Provider.',
  footerQuickLinks: [
    { label: 'Home', to: '/' },
    { label: 'About Us', to: '/about' },
    { label: 'MacBook Services', to: '/services' },
    { label: 'Supported Apple Models', to: '/models' },
    { label: 'Customer Reviews', to: '/reviews' },
    { label: 'FAQs & Help Center', to: '/faq' },
    { label: 'Track My Repair', to: '/track' },
    { label: 'Pay Online', to: '/pay' },
    { label: 'Customer Dashboard', to: '/dashboard' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Book a Repair', to: '/book' },
  ],
  footerServiceLinks: [
    { label: 'MacBook Motherboard Repair', to: '/services?category=Hardware+Repair' },
    { label: 'MacBook Screen Replacement', to: '/services?category=Display+Repair' },
    { label: 'MacBook Battery Replacement', to: '/services?category=Battery+%26+Charging' },
    { label: 'MacBook Liquid Damage Repair', to: '/services?category=Liquid+Damage+Repair' },
    { label: 'MacBook Chip-Level Repair', to: '/services?category=Hardware+Repair' },
    { label: 'iPad & iPhone Model Support', to: '/models' },
  ],
  socialInstagram: 'https://instagram.com/refixpro.in',
  socialFacebook: 'https://facebook.com/refixpro.in',
  socialYoutube: 'https://youtube.com/@refixpro',
  socialLinkedin: 'https://linkedin.com/company/refixpro',
  socialTwitter: 'https://x.com/refixpro_in',
  razorpayEnabled: false,
  razorpayKeyId: '',
  razorpayPaymentLinkUrl: '',
  manualPaymentEnabled: true,
  manualUpiId: 'refixpro@upi',
  manualUpiQrUrl: '',
  manualBankDetails: '',
  manualPaymentNote:
    'Complete UPI or bank transfer only after receiving your final confirmed repair invoice from Refix Pro, then submit your 12-digit UTR / Reference ID below for verification.',
  seoTitle: 'Refix Pro – Best MacBook Repair in Gurugram | SCF-92,SECTOR-14 MAIN MARKET',
  seoDescription:
    'Top-rated MacBook repair at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. Expert MacBook logic board chip-level repair, Retina screen replacement, battery service, liquid damage recovery, and iPad & iPhone repair.',
  seoKeywords:
    'MacBook repair in Gurugram, MacBook repair Gurgaon, MacBook repair SCF-92 Sector 14 Main Market Gurugram, Apple MacBook service center Gurugram, MacBook logic board repair Gurugram, MacBook Pro screen replacement Gurugram, MacBook Air battery replacement Gurugram, MacBook water damage repair Gurugram, iPad repair Gurugram, iPhone repair Gurugram',
  serviceAreasText: '',
  homeFaqs: [
    {
      q: 'Do you repair Apple MacBooks, iPads, and iPhones at Refix Pro Gurugram?',
      a: 'Yes. Refix Pro is primarily dedicated to Apple MacBook diagnostics, logic board chip-level repair, Retina display service, battery replacement, and liquid damage recovery, and also supports original Apple iPad and iPhone hardware repairs at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
    },
    {
      q: 'Can you save my data if my MacBook has logic board or liquid damage?',
      a: 'In most cases, yes. On modern MacBooks with soldered storage, repairing the failed power rails on the logic board restores access without erasing your SSD. We assess data safety before starting work.',
    },
    {
      q: 'How long does MacBook diagnosis and repair take at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007?',
      a: 'Initial inspection and fault confirmation typically happen the same day at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. Component-level board work or display replacements are quoted with a clear timeline once parts compatibility is confirmed.',
    },
    {
      q: 'How can I check the status of my MacBook repair?',
      a: 'Sign into your Customer Dashboard or use the Track My Repair tool right on this page with your RP- Enquiry ID and registered mobile number for live technician status and estimate updates.',
    },
    {
      q: 'Are you an Apple Authorized Service Provider?',
      a: 'No. Refix Pro is an independent MacBook and Apple repair specialist at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007, offering chip-level motherboard repairs and component services outside manufacturer depot swaps.',
    },
  ],
  pageContent: {
    home: {
      heroEyebrow: 'Apple MacBook Repair Specialist · SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007',
      servicesEyebrow: 'Focused Apple Hardware Expertise',
      servicesHeading: 'Our MacBook Repair Services',
      toolsEyebrow: 'Interactive Customer Tools',
      toolsHeading: 'Estimate Repair Costs & Track Live Status',
      toolsSubheading:
        'Select your MacBook, iPad, or iPhone model for a transparent rough repair estimate or check real-time repair progress using your Enquiry ID.',
      whyEyebrow: 'Precision Diagnostic Standard',
      whyHeading: 'Why Choose Refix Pro in Gurugram?',
      whyDescription:
        'Instead of guessing or quoting blanket motherboard swaps, our bench at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 traces exact voltage rails, controller ICs, and display lines before recommending any repair.',
      modelsEyebrow: 'MacBook, iPad & iPhone Support',
      modelsHeading: 'Original Apple Models We Support',
      modelsSubheading:
        'Select your exact MacBook, iPad, or iPhone generation to view model identifiers, common faults, and technician compatibility confirmation.',
      problemsHeading: 'Common MacBook Problems',
      processHeading: 'Our Repair Process',
      reviewsHeading: 'Verified Google & Customer Reviews',
      faqHeading: 'Frequently Asked Questions',
      blogHeading: 'Latest MacBook Repair Guides',
      locationHeading: 'Visit Refix Pro Gurugram',
      finalCtaHeadline: 'Your MacBook Deserves Expert Care. Trust Refix Pro.',
      finalCtaSubheadline:
        'Book a diagnostic slot online or visit SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 for quick model compatibility and inspection guidance.',
    },
    services: {
      headline: 'Apple MacBook Repair Services in Gurugram',
      subheadline:
        'Focused on Apple MacBook hardware, logic boards, Retina displays, batteries, liquid recovery, and macOS stability at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. Component availability and final pricing are confirmed by our technician after inspecting your model.',
      noticeText:
        'Every repair begins with a physical inspection at Refix Pro, SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. Specific parts availability, feasibility, and final estimates are confirmed by our technician prior to repair.',
    },
    models: {
      headline: 'MacBook, iPad & iPhone Models & Compatibility',
      subheadline:
        'Authentic Apple A-numbers across Intel and Apple Silicon MacBook Air & Pro, iPad Pro / Air / Mini, and iPhone 11–16 series. Exact part compatibility is confirmed by our technician at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
      selectorHeading: 'Check Compatibility & Request Repair',
      selectorSubheading:
        'Select your Apple device category, exact model/A-number, and primary symptom to submit a repair enquiry directly.',
      selectorNotice:
        'Support and spare component availability for any MacBook, iPad, or iPhone model are confirmed upon bench inspection at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
    },
    book: {
      headline: 'Book Your Repair in Gurugram',
      subheadline:
        'Quick 30-second booking — just enter your Name, Mobile Number, and Device Model. Optionally describe the issue or attach photos for faster preparation.',
      securityNote:
        'Do not share your macOS login password, iPhone/iPad passcode, Apple Account password, or FileVault key here.',
    },
    track: {
      headline: 'Track Your Repair Status',
      subheadline:
        'Stay updated from initial bench diagnostics through parts confirmation, repair completion, and QA pickup readiness at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
    },
    about: {
      headline: 'About Refix Pro – Apple Repair Specialists in Gurugram',
      subheadline:
        'Refix Pro is a dedicated MacBook & Apple hardware repair studio at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. We focus on logic board troubleshooting, chip-level micro-soldering, display and battery service, and transparent customer support.',
      workshopImageUrl: IMG_WORKSHOP,
      approachHeading: 'Our Approach to Diagnostics & Chip-Level Repair',
      approachDescription:
        'Modern Apple devices pack intricate multi-layer logic boards, USB-C Power Delivery controllers, and tightly integrated display assemblies. Rather than immediately suggesting costly whole-board replacements, our bench prioritizes root-cause fault isolation.',
      galleryHeading: 'Repair Workstation Gallery',
      gallerySubheading:
        'A closer look at our ESD-safe repair benches, Leica stereo microscopy station, display testing setup, and liquid recovery lab at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
    },
    blog: {
      headline: 'MacBook Repair Guides & Insights',
      subheadline:
        'Technical guides from SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 on liquid spill recovery, logic board diagnostics, battery care, and display troubleshooting.',
      sidebarCtaTitle: 'Need Repair Help Today?',
      sidebarCtaText:
        'Visit SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 or schedule a diagnostic inspection online.',
    },
    contact: {
      headline: 'Contact Refix Pro, Gurugram',
      subheadline:
        'Walk in with your MacBook, iPad, or iPhone at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 or message our technical desk directly for quick guidance.',
      formHeading: 'Send a Business Enquiry',
      mapHeading: 'Find Us at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007',
    },
  },
};

export const DEFAULT_BLOG_CATEGORIES: Omit<BlogCategory, 'createdAt'>[] = [
  { id: 'cat-logic-board', name: 'Logic Board & Chip-Level', slug: 'logic-board', description: 'Motherboard diagnostics, power rails, and micro-soldering guides.' },
  { id: 'cat-liquid', name: 'Liquid Damage Recovery', slug: 'liquid-damage', description: 'Emergency spill response and corrosion treatment for MacBooks.' },
  { id: 'cat-battery', name: 'Battery & Charging', slug: 'battery-charging', description: 'Battery health, USB-C PD, and MagSafe troubleshooting.' },
  { id: 'cat-display', name: 'Display & Screen', slug: 'display-screen', description: 'Retina display, backlight, and flex cable diagnostics.' },
  { id: 'cat-hardware', name: 'Keyboard & Cooling', slug: 'keyboard-cooling', description: 'Keyboard, trackpad, thermal paste, and overheating guides.' },
  { id: 'cat-buying-repair', name: 'Repair Guides', slug: 'repair-guides', description: 'Comparing Air vs Pro repairability and maintenance tips.' },
];

export const DEFAULT_BLOG_POSTS: Omit<BlogPost, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'blog-not-turning-on',
    title: 'MacBook Not Turning On? Common Causes and Repair Solutions.',
    slug: 'macbook-not-turning-on-causes-and-repair-solutions',
    category: 'Logic Board & Chip-Level',
    excerpt: 'When your MacBook refuses to power up, the issue could range from a depleted USB-C port controller to a shorted motherboard rail. Here is how specialists diagnose it safely.',
    featuredImage: IMG_USBC,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-11-02',
    seoTitle: 'MacBook Not Turning On? Causes & Repair in Gurugram | Refix Pro',
    seoDescription: 'Learn why a MacBook Air or Pro fails to power on and how chip-level logic board repair in Sector 14, Gurugram resolves power rail failures.',
    tags: ['MacBook No Power', 'Logic Board Repair', 'Gurugram MacBook Service'],
    isFeatured: true,
    views: 412,
    faqs: [
      { question: 'Will my data be erased if my MacBook does not turn on?', answer: 'In many logic board power-rail failures, your data remains intact on the internal SSD. Fixing the board power circuit restores boot access without wiping storage.' },
      { question: 'Should I keep trying different chargers on a dead MacBook?', answer: 'If there is an internal short circuit or liquid spill, repeatedly plugging in power can worsen board damage. Have the charging current checked first.' },
    ],
    content: `## Why Your MacBook Suddenly Refuses to Turn On

A MacBook that shows no chime, no fan spin, and no trackpad click is one of the most stressful hardware problems a user can face. Before assuming the whole device is beyond recovery, it helps to separate simple power-delivery issues from internal motherboard faults.

### 1. Faulty USB-C Cable, Adapter, or Port Module
USB-C Power Delivery requires active negotiation between your charger and the MacBook's port controller (such as CD3215 or CD3217 ICs). A worn cable, burnt pin, or failed port controller locks power delivery at 5 volts instead of negotiating the 20 volts needed to boot.

### 2. Deeply Discharged or Shorted Battery
On many Intel and Apple Silicon models, a failing battery cell or shorted Battery Management System (BMS) can pull down the main power bus, preventing startup even when plugged into the wall.

### 3. Logic Board Power Rail Short Circuits
Capacitors on primary rails like PPBUS_G3H can fail over time or after voltage spikes, creating a direct short to ground. Under thermal imaging and stereo microscopy, a specialist can isolate and replace the single shorted capacitor or power IC rather than swapping the entire logic board.

### Practical First Checks You Can Try Safely
- Hold the power button for 10 full seconds, wait 5 seconds, and press once normally.
- Inspect all USB-C or MagSafe ports with a flashlight for dust or charred pins.
- Try a known-working original Apple wattage adapter on an alternate port.
- If the MacBook recently encountered any moisture, stop plugging it in immediately.

### How Refix Pro Diagnoses Dead MacBooks in Gurugram
At Refix Pro, SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007, we begin with USB-C amp-meter diagnostics, disconnect the battery safely, and inspect primary power rails under Leica microscopy before providing a clear repair estimate.`,
  },
  {
    id: 'blog-water-damage',
    title: 'MacBook Water Damage: What Should You Do Immediately?',
    slug: 'macbook-water-damage-what-to-do-immediately',
    category: 'Liquid Damage Recovery',
    excerpt: 'Spilled water, coffee, or tea on your MacBook? The actions you take in the first 15 minutes determine whether your logic board can be saved cleanly.',
    featuredImage: IMG_LIQUID,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-10-28',
    seoTitle: 'MacBook Water Damage Emergency Guide & Repair Gurgaon | Refix Pro',
    seoDescription: 'Immediate steps after spilling liquid on your MacBook Air or Pro, why rice harms devices, and how ultrasonic cleaning saves logic boards.',
    tags: ['Water Damage', 'Liquid Spill', 'Ultrasonic Cleaning'],
    isFeatured: true,
    views: 389,
    faqs: [
      { question: 'Does putting a wet MacBook in uncooked rice work?', answer: 'No. Rice starch and dust stick inside fans, hinges, and logic board pads while failing to stop electrolytic corrosion underneath micro-chips.' },
      { question: 'My MacBook still turns on after a spill—do I still need cleaning?', answer: 'Yes. Even if it turns on today, mineral residue slowly corrodes copper traces over days or weeks until a sudden short circuit occurs.' },
    ],
    content: `## Immediate Steps After a MacBook Liquid Spill

Whether it is plain water, coffee, tea, or rain during a commute, liquid inside a MacBook reacts rapidly with live battery voltage. Even when the lid is closed, the battery stays connected to primary logic board rails.

### Step 1: Power Off & Unplug Immediately
Hold the power button until the MacBook completely shuts down. Unplug the MagSafe or USB-C charger and disconnect all external drives or dongles.

### Step 2: Drain Safely Without Shaking
Open the lid wide and place the MacBook in an inverted "V" tent position over a clean dry towel so liquid drains away from the logic board and display hinge.

### Step 3: Avoid Common Myths (No Rice, No Hairdryer)
- **Never use uncooked rice**: Fine dust enters keyboard membranes and fan bearings.
- **Never use a hot hairdryer**: Heat warps keycaps and pushes moisture deeper under BGA chips.
- **Do not turn it back on to "test"**: Applying power to wet traces accelerates electrolysis and burns copper pads.

### Why Professional Ultrasonic Decontamination Matters
At Refix Pro, SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007, our liquid-damage workflow disconnects the battery first, strips down the board, treats oxidized areas under a microscope, runs specialized ultrasonic cleaning, and verifies every rail before reassembly.`,
  },
  {
    id: 'blog-battery-draining',
    title: 'MacBook Battery Draining Fast – Causes and Solutions.',
    slug: 'macbook-battery-draining-fast-causes-and-solutions',
    category: 'Battery & Charging',
    excerpt: 'Is your MacBook losing charge rapidly or showing Service Recommended? Learn how to distinguish natural cell aging from background drain or board leakage.',
    featuredImage: IMG_BATTERY,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-10-20',
    seoTitle: 'MacBook Battery Draining Fast? Causes & Replacement Gurugram',
    seoDescription: 'Fix rapid MacBook battery drain in Gurugram. Understand cycle count, Service Recommended alerts, sleep drain, and safe battery replacement.',
    tags: ['Battery Replacement', 'Battery Drain', 'MacBook Air Battery'],
    isFeatured: false,
    views: 294,
    faqs: [
      { question: 'When should a MacBook battery be replaced?', answer: 'Typically when full-charge capacity drops below 80%, macOS displays "Service Recommended", or the laptop shuts down unexpectedly under load.' },
      { question: 'What if the trackpad feels stiff or raised?', answer: 'A stiff trackpad or uneven bottom cover often indicates a swollen lithium-polymer cell. Stop charging and have it safely removed immediately.' },
    ],
    content: `## Diagnosing Fast MacBook Battery Drain

Modern MacBooks are built for all-day battery endurance, so sudden drops in runtime feel disruptive right away. Rapid drain generally traces back to one of three areas: degraded cells, runaway background software, or subtle hardware current leakage.

### 1. Natural Chemical Aging & Cycle Count
You can check your MacBook's cycle count in **System Settings > General > About > System Report > Power**. As lithium cells cross several hundred cycles, internal resistance rises and capacity drops.

### 2. Sleep-Wake & USB Accessory Drain
Left-behind USB-C hubs, unoptimized browser tabs, or Spotlight re-indexing can keep the SoC awake inside your backpack, draining 30–40% overnight.

### 3. Hardware Leakage on the Logic Board
Occasionally, even a new battery drains fast because a shorted capacitor or liquid-damaged sensor circuit draws excess milliamps while asleep.

### Safe Battery Replacement in Gurugram
At Refix Pro, we inspect both the battery's health metrics and idle board current draw before replacing degraded cells—confirming compatibility for your exact MacBook Air or Pro model first.`,
  },
  {
    id: 'blog-screen-replacement',
    title: 'MacBook Screen Replacement in Gurugram.',
    slug: 'macbook-screen-replacement-in-gurugram',
    category: 'Display & Screen',
    excerpt: 'Cracked Retina glass, vertical lines, or a black screen? Understand your MacBook display options and why proper diagnostics save unnecessary expense.',
    featuredImage: IMG_DISPLAY,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-10-14',
    seoTitle: 'MacBook Screen Replacement in Gurugram | Retina Display Repair',
    seoDescription: 'Expert MacBook Retina screen replacement and display diagnostics in Sector 14, Gurugram. Backlight, flex cable, and cracked panel assessment.',
    tags: ['Screen Replacement', 'Retina Display', 'Gurugram'],
    isFeatured: true,
    views: 345,
    faqs: [
      { question: 'Does a black screen always mean I need a new Retina display?', answer: 'Not always. Sometimes a blown backlight fuse or fatigued display flex cable causes a black screen while the LCD panel itself is still healthy.' },
      { question: 'How do you confirm display part availability?', answer: 'Once you share your MacBook A-number (printed on the bottom case) or visit our Sector 14 desk, our technician confirms exact panel compatibility and lead time.' },
    ],
    content: `## What to Know Before Replacing a MacBook Screen in Gurugram

MacBook Retina and Liquid Retina displays are ultra-thin precision assemblies integrating the LCD panel, backlight layers, webcam, lid angle sensor, and anodized aluminum housing.

### When Full Display Replacement Is Needed
- Physical cracks, black ink blotches, or pressure fractures from closing the lid over a pen, earbud, or webcam cover.
- Permanent vertical or horizontal color bands caused by internal glass or T-Con damage.

### When Your Display Might NOT Need Replacement
Before recommending a display swap, our technicians test:
1. **External Monitor Output**: Confirms whether the logic board GPU/SoC is producing video.
2. **Backlight Circuit**: Checks if a faint image is visible under a flashlight (indicating a board-level backlight fault rather than a dead screen).
3. **Display Connector & Flex Cable**: Inspects for corrosion or hinge cable fatigue.

Visit Refix Pro at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 for an honest screen damage assessment before committing to replacement.`,
  },
  {
    id: 'blog-logic-board-explained',
    title: 'MacBook Logic Board Repair Explained.',
    slug: 'macbook-logic-board-repair-explained',
    category: 'Logic Board & Chip-Level',
    excerpt: 'Why swap the entire motherboard when targeted schematic-driven logic board repair can fix the exact failed component and preserve your data?',
    featuredImage: IMG_MICROSCOPE,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-10-08',
    seoTitle: 'MacBook Logic Board Repair Explained | Refix Pro Gurugram',
    seoDescription: 'Understand how MacBook logic board diagnostics, thermal imaging, and micro-soldering repair faults at a fraction of full board replacement.',
    tags: ['Logic Board', 'Motherboard Repair', 'Micro-Soldering'],
    isFeatured: false,
    views: 267,
    faqs: [
      { question: 'Is logic board repair reliable long-term?', answer: 'When performed with proper flux, hot-air profiles, OEM-grade replacement ICs, and thorough ultrasonic cleanup, board-level repairs are highly durable.' },
    ],
    content: `## Understanding the MacBook Logic Board

Inside every MacBook, the logic board houses the processor/Apple Silicon SoC, unified or soldered memory, storage NAND, power management controllers, and display/I/O circuits on a dense multi-layer PCB.

### Whole-Board Replacement vs. Component-Level Repair
Standard service desks often quote for swapping the entire logic board—which is expensive and, on modern T2 and Apple Silicon Macs with soldered SSDs, results in complete data loss. Component-level logic board repair locates the exact failed IC, MOSFET, resistor, or corroded trace and restores it.

### Inside Our Diagnostic Bench Workflow
- **Visual Microscope Inspection**: Checking for tiny burn marks, cracked inductors, or green liquid oxidation.
- **Voltage & Resistance Mapping**: Testing power rails against reference schematics.
- **Thermal Camera Scanning**: Locating microscopic shorts that warm up under controlled current injection.
- **Post-Repair Stress Testing**: Validating charging, sleep/wake, USB-C peripherals, and thermals.`,
  },
  {
    id: 'blog-charging-problem',
    title: 'MacBook Charging Problem – Causes and Solutions.',
    slug: 'macbook-charging-problem-causes-and-solutions',
    category: 'Battery & Charging',
    excerpt: 'MacBook plugged in but not charging, or charging only on one port? Explore USB-C controller, MagSafe, and battery health causes.',
    featuredImage: IMG_HERO_PRO,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-09-29',
    seoTitle: 'MacBook Not Charging? Causes & Repair in Gurugram | Refix Pro',
    seoDescription: 'Fix MacBook USB-C and MagSafe charging problems in Gurugram. Understand adapter negotiation, port wear, and charging circuit faults.',
    tags: ['Charging Problem', 'USB-C Port', 'MagSafe'],
    isFeatured: false,
    views: 215,
    faqs: [
      { question: 'Why does my MacBook charge on one USB-C port but not the other?', answer: 'Each port or side is managed by dedicated USB-C controller circuitry or port flex hardware. A failing port socket or controller chip isolates the fault to that side.' },
    ],
    content: `## Why Your MacBook Stops Charging

Charging issues are among the most common reasons Gurugram professionals visit Refix Pro. Fortunately, a methodical check narrows the root cause quickly.

### Common Charging Culprits
1. **Damaged USB-C Cable or Underpowered Brick**: Frayed Type-C cables fail CC-line communication, locking charging at 5V.
2. **Worn or Burnt Port Pins**: Dust lint or moisture inside MagSafe 3 or USB-C ports causes arcing and carbon buildup.
3. **USB-C Controller (CD3215 / CD3217) Failure**: Voltage spikes from third-party hubs or unstable power strips frequently damage these controller chips.
4. **Degraded Battery / BMS Lockout**: An end-of-life battery can refuse charge acceptance for safety.

Bring your MacBook and charger together to Refix Pro at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 so we can test both the adapter output and internal charging circuit.`,
  },
  {
    id: 'blog-keyboard-not-working',
    title: 'MacBook Keyboard Not Working? Repair Guide.',
    slug: 'macbook-keyboard-not-working-repair-guide',
    category: 'Keyboard & Cooling',
    excerpt: 'Keys repeating, dead rows, or keyboard completely unresponsive? Discover when debris cleaning helps and when top-case keyboard replacement is required.',
    featuredImage: IMG_KEYBOARD,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-09-21',
    seoTitle: 'MacBook Keyboard Not Working? Repair Guide | Refix Pro Gurugram',
    seoDescription: 'Fix unresponsive, sticky, or double-typing MacBook Air and Pro keys in Gurugram. Hardware vs flex cable diagnosis explained.',
    tags: ['Keyboard Replacement', 'Sticky Keys', 'Trackpad Flex'],
    isFeatured: false,
    views: 198,
    faqs: [
      { question: 'Can a single damaged MacBook keycap be fixed?', answer: 'If only a scissor mechanism or keycap is broken, individual replacement may be possible; if multiple keys fail due to membrane or spill damage, full keyboard replacement is required.' },
    ],
    content: `## Troubleshooting a Non-Responsive MacBook Keyboard

When keys stop responding or double-type letters, work grinds to a halt. Here is how to identify what is happening beneath your MacBook's top case.

### 1. Dust or Debris Under Key Switches
Crumb particles under Butterfly or Scissor switches prevent clean contact. Controlled compressed-air cleaning at a shallow angle may free stuck individual keys.

### 2. Whole Rows or Entire Keyboard Dead
If the power button still works while the rest of the keyboard and trackpad freeze, the shared trackpad/IPD flex cable or keyboard controller on the logic board may be corroded or loose.

### 3. Swollen Battery Pressure
On slim MacBook Pro and Air models, an expanding battery presses upward against the trackpad and keyboard underside.

### Precision Keyboard Replacement
Replacing an internal MacBook keyboard involves removing the logic board, speakers, and battery carefully to access the riveted keyboard plate cleanly without warping the aluminum unibody.`,
  },
  {
    id: 'blog-overheating',
    title: 'MacBook Overheating – Common Causes.',
    slug: 'macbook-overheating-common-causes',
    category: 'Keyboard & Cooling',
    excerpt: 'Excessive heat and loud fans slow down your MacBook through thermal throttling. Learn what causes MacBook overheating and how cleaning restores quiet speed.',
    featuredImage: IMG_THERMAL,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-09-14',
    seoTitle: 'MacBook Overheating Causes & Cooling Service in Gurugram',
    seoDescription: 'Stop MacBook thermal throttling and loud fans. Dust cleanup, thermal paste renewal, and cooling system repair in Sector 14, Gurugram.',
    tags: ['Overheating', 'Thermal Paste', 'Fan Replacement'],
    isFeatured: false,
    views: 184,
    faqs: [
      { question: 'Do fanless MacBook Air M1/M2 models overheat too?', answer: 'Yes, while they have no spinning fan, degraded thermal pads, dust near hinge vents, or heavy ambient heat can still cause thermal throttling.' },
    ],
    content: `## Why MacBooks Run Hot & Throttle Performance

macOS automatically lowers CPU/GPU clock speeds when internal temperatures climb too high—making even simple browser or video-call workloads feel sluggish.

### Top Causes of MacBook Overheating
- **Clogged Heatsink Fins**: Lint and dust pack tightly into exhaust vents over 12–24 months of daily use.
- **Dried Thermal Paste**: Factory thermal compound dries and cracks over years, losing heat-transfer efficiency between the processor die and copper heatpipe.
- **Failing or Seized Cooling Fan**: Worn bearings slow fan RPM or trigger high-pitched grinding.
- **Blocked Airflow**: Using a MacBook on soft beds or cushions traps exhaust heat underneath the chassis.

A scheduled internal cooling cleanup and thermal interface refresh keeps temperatures lower, fans quieter, and battery cells healthier.`,
  },
  {
    id: 'blog-air-vs-pro-repair',
    title: 'MacBook Air vs MacBook Pro Repair: What You Should Know.',
    slug: 'macbook-air-vs-macbook-pro-repair-what-you-should-know',
    category: 'Repair Guides',
    excerpt: 'Key hardware differences between MacBook Air and MacBook Pro designs—from cooling fans and Retina XDR displays to charging circuitry and repair timelines.',
    featuredImage: IMG_WORKSHOP,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-09-05',
    seoTitle: 'MacBook Air vs MacBook Pro Repair Differences | Refix Pro',
    seoDescription: 'Understand how MacBook Air and MacBook Pro internal architectures differ when it comes to screen, battery, cooling, and logic board repairs.',
    tags: ['MacBook Air', 'MacBook Pro', 'Repair Guide'],
    isFeatured: false,
    views: 231,
    faqs: [
      { question: 'Which is faster to repair: MacBook Air or MacBook Pro?', answer: 'Standard battery or port repairs are often straightforward on both, while high-wattage Pro logic boards and XDR displays require model-specific parts verification.' },
    ],
    content: `## Comparing MacBook Air and MacBook Pro Service Needs

While MacBook Air and MacBook Pro share Apple's unibody philosophy, their internal layouts differ meaningfully when hardware service is needed.

### Cooling Architecture
Apple Silicon MacBook Air models use passive heatsink dissipation without spinning fans, keeping dust buildup lower. MacBook Pro models pack active single or dual blowers that require periodic dust removal and thermal paste care.

### Display & Power Complexity
MacBook Pro 14" and 16" models feature Mini-LED Liquid Retina XDR panels and multi-phase VRM power delivery designed for sustained workstation loads—making accurate schematic diagnostics essential during board repairs.

### Checking Compatibility Before Booking
Before ordering any component, Refix Pro verifies your exact Model Identifier (e.g., A2337, A2442, A2681) so the right part grade and repair timeline are confirmed upfront.`,
  },
  {
    id: 'blog-chip-level-guide',
    title: 'MacBook Chip-Level Repair: A Complete Guide.',
    slug: 'macbook-chip-level-repair-complete-guide',
    category: 'Logic Board & Chip-Level',
    excerpt: 'A behind-the-bench look at micro-soldering, BGA rework, boardview schematics, and how chip-level repair rescues MacBooks deemed unrepairable.',
    featuredImage: IMG_MACOS,
    authorName: 'Refix Pro Technical Desk',
    status: 'published',
    publishedAt: '2026-08-27',
    seoTitle: 'MacBook Chip-Level Repair Guide | Micro-Soldering Gurugram',
    seoDescription: 'Complete guide to MacBook chip-level repair in Gurugram: stereo microscopy, USB-C controllers, PMICs, backlight ICs, and corrosion recovery.',
    tags: ['Chip-Level Repair', 'Micro-Soldering', 'Sector 14 Gurugram'],
    isFeatured: true,
    views: 356,
    faqs: [
      { question: 'What equipment is used in chip-level MacBook repair?', answer: 'Stereo Leica-grade microscopes, precision micro-pencils, regulated hot-air stations, ultrasonic cleaners, DC bench power supplies, and boardview schematics.' },
    ],
    content: `## Inside Precision MacBook Chip-Level Repair

Chip-level repair is the surgical discipline of diagnosing and restoring individual microscopic components—some smaller than a grain of sand (0201 SMD resistors and capacitors)—directly on a MacBook logic board.

### Common Chip-Level Faults We Resolve
- **USB-C Power Delivery Controllers**: Restoring 20V negotiation when ports stay stuck at 5V.
- **Backlight Boost ICs & Diodes**: Bringing dark-screen MacBooks back to crisp illumination.
- **Shorted Filter Capacitors**: Eliminating dead-short power rails caused by age or moisture.
- **Trace Reconstruction**: Rebuilding copper pathways etched away by liquid corrosion.

### Why Precision Tooling Matters
Without proper stereo magnification, controlled pre-heating, and ESD protection, overheating a multi-layer Apple PCB can cause internal layer delamination. At Refix Pro, SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007, every board enters a dedicated ESD-safe micro-soldering bench for methodical diagnostics before any repair begins.`,
  },
];

export const DEFAULT_REVIEWS: Omit<ReviewItem, 'createdAt'>[] = [
  {
    id: 'rev-google-1',
    authorLabel: 'Verified Google Review · Refix Pro',
    rating: 5,
    quote: 'Best equipment, skilled service team and genuine work provided here.',
    source: 'Google Business Profile',
    dateLabel: 'Verified Review',
    isVisible: true,
  },
  {
    id: 'rev-google-2',
    authorLabel: 'Verified Google Review · Refix Pro',
    rating: 5,
    quote: 'They delivered everything they promised and provided excellent service.',
    source: 'Google Business Profile',
    dateLabel: 'Verified Review',
    isVisible: true,
  },
  {
    id: 'rev-google-3',
    authorLabel: 'Verified Google Review · Refix Pro',
    rating: 5,
    quote: 'Best place for laptop repair or buying laptop etc.',
    source: 'Google Business Profile',
    dateLabel: 'Verified Review',
    isVisible: true,
  },
];

export const DEFAULT_GALLERY_IMAGES: Omit<GalleryImageItem, 'createdAt'>[] = [
  {
    id: 'gal-display-calibration',
    title: 'Retina Display Calibration & Testing',
    caption: 'Panel uniformity, eDP connector, and backlight inspection workstation.',
    imageUrl: IMG_DISPLAY,
    category: 'Display Lab',
    sortOrder: 1,
  },
  {
    id: 'gal-battery-assembly',
    title: 'Internal Battery & Cell Service',
    caption: 'Organized magnetic screw mapping during MacBook battery servicing.',
    imageUrl: IMG_BATTERY,
    category: 'Battery Bench',
    sortOrder: 2,
  },
  {
    id: 'gal-liquid-cleaning',
    title: 'Liquid Damage Inspection Station',
    caption: 'Corrosion mapping and ultrasonic board treatment for liquid-damaged MacBooks.',
    imageUrl: IMG_LIQUID,
    category: 'Liquid Recovery',
    sortOrder: 3,
  },
  {
    id: 'gal-keyboard-topcase',
    title: 'Keyboard & Trackpad Assembly Bench',
    caption: 'Precision scissor-switch keyboard and Force Touch trackpad servicing.',
    imageUrl: IMG_KEYBOARD,
    category: 'Input Hardware',
    sortOrder: 4,
  },
  {
    id: 'gal-thermal-cooling',
    title: 'Cooling & Thermal Servicing',
    caption: 'Dual blower fan cleaning, copper heatpipe care, and thermal compound renewal.',
    imageUrl: IMG_THERMAL,
    category: 'Thermal Care',
    sortOrder: 5,
  },
  {
    id: 'gal-usbc-power-bench',
    title: 'USB-C Power Delivery Diagnostics',
    caption: 'Digital 20V PD negotiation and charging controller verification bench.',
    imageUrl: IMG_USBC,
    category: 'Power Testing',
    sortOrder: 6,
  },
];

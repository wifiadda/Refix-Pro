# Refix Pro Security Specification

## 1. Data Invariants
1. **Default-Deny Baseline**: Every unmapped Firestore path denies all reads and writes.
2. **Admin Role Isolation**: Only verified Google-authenticated users whose verified email is the business owner (`refixpro.in@gmail.com` or `wifiadda76@gmail.com`) or whose UID exists in `/admins/{uid}` (with `request.auth.token.email_verified == true`) hold `isAdmin()` privileges. Users cannot self-assign admin roles.
3. **PII Isolation & Non-PII Tracking**: `repairEnquiries` and `contactMessages` contain customer phone numbers, WhatsApp numbers, and email addresses. Public visitors can ONLY `create` new records with strictly validated initial state (`status == 'New'`, `isRead == false`, server timestamps `request.time`, empty technician fields). Public `get`, `list`, `update`, and `delete` are strictly forbidden on `repairEnquiries` and `contactMessages` (Admin-only). Public repair status tracking uses a split non-PII projection `/repairTracking/{trackingId}` keyed by SHA-256 hash of `enquiryCode` + normalized `mobile` with `allow list: if isAdmin()` to prevent enumeration.
4. **Published Content Filtering**: `blogPosts` only permits public `get` and `list` when `resource.data.status == 'published'`. Drafts and scheduled articles are readable only by `isAdmin()`.
5. **Active Service & Visible Review Filtering**: `reviews` only exposes `isVisible == true` publicly unless `isAdmin()`. `services` and `macbookModels` (covering Apple MacBook, iPad & Tablet, and iPhone catalogs) allow public read of active catalog data, while all mutations are strictly `isAdmin()`. `websiteSettings/main` stores editable Header, Footer, SEO, FAQ, and per-page CMS content as bounded native maps and lists editable only by `isAdmin()`.
6. **Strict Payload & Size Caps**: Every document creation and update checks `isValidId()` on document IDs, exact key allowlists (`hasAll`/`hasOnly`), strict field types, and bounded string/array sizes to prevent resource exhaustion ("Denial of Wallet") or ghost fields.
7. **Temporal Integrity**: Creation and update timestamps (`createdAt`, `updatedAt`) are verified against `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Admin Write**: Unauthenticated client attempts `setDoc('/admins/hacker', { uid: 'hacker', email: 'h@x.com', role: 'super_admin' })` -> DENIED.
2. **Self-Role Escalation**: Signed-in non-admin user attempts `setDoc('/admins/' + uid, ...)` -> DENIED.
3. **Email Spoofing (Unverified Email)**: User with `email_verified: false` claiming owner email attempts admin read on `/repairEnquiries` -> DENIED.
4. **PII Scraping (List Enquiries)**: Non-admin signed-in user or anonymous visitor attempts `getDocs('/repairEnquiries')` -> DENIED.
5. **PII Scraping (Read Contact Messages)**: Visitor attempts `getDoc('/contactMessages/msg1')` -> DENIED.
6. **Status Shortcutting on Enquiry Create**: Visitor submits `/repairEnquiries/id1` with `status: 'Completed'` or non-empty `technicianNotes` -> DENIED.
7. **Shadow / Ghost Field Injection**: Visitor submits `/repairEnquiries/id1` with an extra field `{ isApproved: true }` -> DENIED by `hasOnly`.
8. **Timestamp Forgery**: Visitor submits `/contactMessages/id1` with a backdated `createdAt` not equal to `request.time` -> DENIED.
9. **ID Poisoning**: Attacker attempts `setDoc('/repairEnquiries/' + 'a'.repeat(500), ...)` or invalid characters `bad/id$1` -> DENIED by `isValidId`.
10. **Draft Blog Leak**: Public visitor queries `/blogPosts` without `status == 'published'` or reads a `draft` post -> DENIED.
11. **Value Poisoning / Oversized Payload**: Visitor submits `problemDescription` > 2000 chars or `imageUrls` > 4 items -> DENIED.
12. **Unauthorized Settings Tampering**: Signed-in non-admin attempts `updateDoc('/websiteSettings/main', { phone: '0000000000' })` -> DENIED.

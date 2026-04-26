Plan to build the complete CareerKit Collectives website

1. Replace the placeholder page with a polished public landing page
- Create a responsive one-page landing site at `/` with:
  - Sticky minimal nav using the CareerKit Collectives brand name
  - Hero headline: “Premium Career Templates – Land Your Next Role with Confidence”
  - Subheadline and “Explore Templates” smooth-scroll CTA
  - Product grid section with cards for active products
  - Trust/features bar: “Editable & ATS-Friendly”, “Instant Digital Download”, “Matching Bundle Sets”
  - Clean navy footer with copyright and brand text
- Use the requested design system: navy, white, restrained gold accents, clean sans-serif typography, white space, soft shadows, abstract/document-style visuals only.
- Make the layout mobile-first and polished across phone, tablet, and desktop.

2. Add Supabase-backed product data
- Set up the `products` table with:
  - `id`, `title`, `description`, `price`, `gumroad_url`, `image_url`, `sort_order`, `is_active`, `created_at`
- Add public read access for active products so the landing page can display them.
- Add authenticated-only write access so logged-in admin users can create, edit, and delete products.
- Seed the initial six products:
  - Resume Template
  - Cover Letter Template
  - Expert Content Layer
  - Job Application Bundle
  - Email Template
  - Complete Career Success Bundle
- Use tasteful placeholder/mockup-style thumbnails if no product images are provided yet, while allowing replacement through admin upload.

3. Add public product cards and buying behavior
- Fetch active products from Supabase, ordered by `sort_order` ascending.
- Display cards in a responsive grid: compact on mobile, wider on tablet/desktop.
- Each card will show thumbnail, title, short description, price, and a gold “Buy Now” button.
- Buy buttons will open the saved Gumroad URL in a new tab with safe external-link attributes.
- Add loading, empty, and error states so the page remains professional even before products are added.

4. Add Supabase Storage for product images
- Create a public `product-images` bucket.
- Allow public reads.
- Allow authenticated users to upload images.
- Restrict intended uploads to jpg, png, and webp with a 2 MB limit where supported.
- The admin form will upload selected images and save the public URL into `products.image_url`.

5. Add authentication and protected admin pages
- Use Supabase email/password authentication.
- Do not add public signup UI.
- Add `/admin/login` with email/password fields, clean error handling, and redirect after successful login.
- Add `/admin` as a protected dashboard; unauthenticated users redirect to `/admin/login`.
- Since you confirmed there is only one admin and no profiles are needed, any manually-created Supabase Auth user will have admin access.

6. Build the admin product management dashboard
- Add a clean “Product Management” dashboard with:
  - Add New Product button
  - Existing products list/table with thumbnail, title, price, active status, sort order
  - Edit and delete actions
  - Confirmation dialog before delete
- Add an add/edit product form with:
  - Title
  - Description
  - Price
  - Gumroad URL
  - Image upload with preview
  - Sort order
  - Active checkbox
- Ensure saved changes appear on the public landing page after refresh.

7. SEO, accessibility, and production polish
- Set SEO title: “Career Templates – Professional Resume & Cover Letter Downloads”
- Set SEO description for career template downloads.
- Add accessible labels, keyboard-friendly controls, visible focus states, and semantic sections.
- Keep public pages lightweight for strong Lighthouse performance.
- Prevent admin pages from being public-facing in the UI and add noindex metadata where applicable.

Technical notes
- This will be implemented in the existing Lovable stack: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, and Supabase/Lovable Cloud. Next.js is not used because Lovable projects do not support Next.js in this environment.
- Routes to add:
```text
/              Public landing page
/admin/login   Admin sign-in
/admin         Protected product dashboard
```
- Database access will use secure Supabase Row Level Security policies:
  - Public can read active products.
  - Authenticated users can manage products.
  - No profiles table will be created.
- After implementation, you will create your admin account manually in Supabase Authentication, then log in at `/admin/login`.
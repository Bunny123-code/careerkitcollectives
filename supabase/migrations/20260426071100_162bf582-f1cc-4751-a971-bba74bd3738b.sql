create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price text not null,
  gumroad_url text not null,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Public can view active products" on public.products;
drop policy if exists "Authenticated users can view all products" on public.products;
drop policy if exists "Authenticated users can create products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

create policy "Public can view active products"
on public.products
for select
to anon
using (is_active = true);

create policy "Authenticated users can view all products"
on public.products
for select
to authenticated
using (true);

create policy "Authenticated users can create products"
on public.products
for insert
to authenticated
with check (true);

create policy "Authenticated users can update products"
on public.products
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete products"
on public.products
for delete
to authenticated
using (true);

create index if not exists idx_products_public_order on public.products (is_active, sort_order, created_at);

insert into public.products (title, description, price, gumroad_url, image_url, sort_order, is_active)
values
  ('Resume Template', 'A polished, ATS-friendly resume template designed for clear storytelling, refined structure, and confident applications.', '$14', 'https://gumroad.com/', null, 1, true),
  ('Cover Letter Template', 'A concise, persuasive cover letter template that helps you connect your experience to the role with clarity.', '$9', 'https://gumroad.com/', null, 2, true),
  ('Expert Content Layer', 'Professionally written content prompts and role-focused phrasing to strengthen your resume and application materials.', '$19', 'https://gumroad.com/', null, 3, true),
  ('Job Application Bundle', 'A matching resume and cover letter bundle for a cohesive, professional application package.', '$21', 'https://gumroad.com/', null, 4, true),
  ('Email Template (Thank You / Follow-Up)', 'Ready-to-send thank you and follow-up email templates for polished communication after interviews and applications.', '$7', 'https://gumroad.com/', null, 5, true),
  ('Complete Career Success Bundle', 'The full set: resume, cover letter, expert content layer, and email templates for a complete career toolkit.', '$39', 'https://gumroad.com/', null, 6, true)
on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product images are public" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;

create policy "Product images are public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

create policy "Authenticated users can upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "Authenticated users can update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "Authenticated users can delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');
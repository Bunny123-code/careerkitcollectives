drop policy if exists "Authenticated users can create products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;

create policy "Authenticated users can create products"
on public.products
for insert
to authenticated
with check (auth.uid() is not null);

create policy "Authenticated users can update products"
on public.products
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "Authenticated users can delete products"
on public.products
for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "Product images are public" on storage.objects;

create policy "Product image files are public"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
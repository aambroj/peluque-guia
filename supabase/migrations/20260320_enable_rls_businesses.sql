alter table public.businesses enable row level security;

drop policy if exists "Businesses select por negocio" on public.businesses;
drop policy if exists "Businesses update por negocio" on public.businesses;
drop policy if exists "Businesses delete por negocio" on public.businesses;

create policy "Businesses select por negocio"
on public.businesses
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = businesses.id
  )
);

create policy "Businesses update por negocio"
on public.businesses
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = businesses.id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = businesses.id
  )
);

create policy "Businesses delete por negocio"
on public.businesses
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = businesses.id
  )
);
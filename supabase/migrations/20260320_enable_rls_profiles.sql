alter table public.profiles enable row level security;

drop policy if exists "Profiles select own" on public.profiles;
drop policy if exists "Profiles update own" on public.profiles;

create policy "Profiles select own"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
);

create policy "Profiles update own"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);
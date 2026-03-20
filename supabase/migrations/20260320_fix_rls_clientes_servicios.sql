alter table public.clientes enable row level security;

drop policy if exists "Permitir lectura clientes" on public.clientes;
drop policy if exists "Permitir insertar clientes" on public.clientes;
drop policy if exists "Permitir actualizar clientes" on public.clientes;
drop policy if exists "Permitir borrar clientes" on public.clientes;

drop policy if exists "Clientes select por negocio" on public.clientes;
drop policy if exists "Clientes insert por negocio" on public.clientes;
drop policy if exists "Clientes update por negocio" on public.clientes;
drop policy if exists "Clientes delete por negocio" on public.clientes;

create policy "Clientes select por negocio"
on public.clientes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = clientes.business_id
  )
);

create policy "Clientes insert por negocio"
on public.clientes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = clientes.business_id
  )
);

create policy "Clientes update por negocio"
on public.clientes
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = clientes.business_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = clientes.business_id
  )
);

create policy "Clientes delete por negocio"
on public.clientes
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = clientes.business_id
  )
);

alter table public.servicios enable row level security;

drop policy if exists "Servicios select por negocio" on public.servicios;
drop policy if exists "Servicios insert por negocio" on public.servicios;
drop policy if exists "Servicios update por negocio" on public.servicios;
drop policy if exists "Servicios delete por negocio" on public.servicios;

create policy "Servicios select por negocio"
on public.servicios
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = servicios.business_id
  )
);

create policy "Servicios insert por negocio"
on public.servicios
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = servicios.business_id
  )
);

create policy "Servicios update por negocio"
on public.servicios
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = servicios.business_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = servicios.business_id
  )
);

create policy "Servicios delete por negocio"
on public.servicios
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = servicios.business_id
  )
);
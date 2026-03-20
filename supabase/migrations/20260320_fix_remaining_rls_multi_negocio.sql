alter table public.empleados enable row level security;
alter table public.reservas enable row level security;
alter table public.employee_schedules enable row level security;
alter table public.employee_time_off enable row level security;
alter table public.servicios enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'empleados'
  loop
    execute format('drop policy if exists %I on public.empleados', pol.policyname);
  end loop;
end $$;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'reservas'
  loop
    execute format('drop policy if exists %I on public.reservas', pol.policyname);
  end loop;
end $$;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'employee_schedules'
  loop
    execute format('drop policy if exists %I on public.employee_schedules', pol.policyname);
  end loop;
end $$;

do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'employee_time_off'
  loop
    execute format('drop policy if exists %I on public.employee_time_off', pol.policyname);
  end loop;
end $$;

drop policy if exists "Servicios public select visibles" on public.servicios;

create policy "Empleados select por negocio"
on public.empleados
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = empleados.business_id
  )
);

create policy "Empleados insert por negocio"
on public.empleados
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = empleados.business_id
  )
);

create policy "Empleados update por negocio"
on public.empleados
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = empleados.business_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = empleados.business_id
  )
);

create policy "Empleados delete por negocio"
on public.empleados
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = empleados.business_id
  )
);

create policy "Empleados public select bookables"
on public.empleados
for select
to anon, authenticated
using (
  coalesce(public_booking_enabled, false) = true
  and coalesce(lower(trim(status)), '') not in ('inactivo', 'descanso', 'vacaciones')
);

create policy "Reservas select por negocio"
on public.reservas
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = reservas.business_id
  )
);

create policy "Reservas insert por negocio"
on public.reservas
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = reservas.business_id
  )
);

create policy "Reservas update por negocio"
on public.reservas
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = reservas.business_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = reservas.business_id
  )
);

create policy "Reservas delete por negocio"
on public.reservas
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = reservas.business_id
  )
);

create policy "Employee schedules select por negocio"
on public.employee_schedules
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_schedules.business_id
  )
);

create policy "Employee schedules insert por negocio"
on public.employee_schedules
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_schedules.business_id
  )
);

create policy "Employee schedules update por negocio"
on public.employee_schedules
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_schedules.business_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_schedules.business_id
  )
);

create policy "Employee schedules delete por negocio"
on public.employee_schedules
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_schedules.business_id
  )
);

create policy "Employee schedules public select for bookable employees"
on public.employee_schedules
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.empleados e
    where e.id = employee_schedules.employee_id
      and e.business_id = employee_schedules.business_id
      and coalesce(e.public_booking_enabled, false) = true
      and coalesce(lower(trim(e.status)), '') not in ('inactivo', 'descanso', 'vacaciones')
  )
);

create policy "Employee time off select por negocio"
on public.employee_time_off
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_time_off.business_id
  )
);

create policy "Employee time off insert por negocio"
on public.employee_time_off
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_time_off.business_id
  )
);

create policy "Employee time off update por negocio"
on public.employee_time_off
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_time_off.business_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_time_off.business_id
  )
);

create policy "Employee time off delete por negocio"
on public.employee_time_off
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = employee_time_off.business_id
  )
);

create policy "Employee time off public select for bookable employees"
on public.employee_time_off
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.empleados e
    where e.id = employee_time_off.employee_id
      and e.business_id = employee_time_off.business_id
      and coalesce(e.public_booking_enabled, false) = true
      and coalesce(lower(trim(e.status)), '') not in ('inactivo', 'descanso', 'vacaciones')
  )
);

create policy "Servicios public select visibles"
on public.servicios
for select
to anon, authenticated
using (
  coalesce(public_visible, false) = true
);
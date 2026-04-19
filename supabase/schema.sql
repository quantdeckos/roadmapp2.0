create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  due_date date,
  phase_count integer not null default 20 check (phase_count > 0),
  current_phase_number integer not null default 1 check (current_phase_number > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_number integer not null check (phase_number > 0),
  title text not null,
  is_locked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, phase_number)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.phases(id) on delete cascade,
  title text not null,
  exp integer not null default 10,
  duration_minutes integer not null default 15,
  category text not null check (category in ('health', 'finance', 'strategy', 'execution')),
  completed boolean not null default false,
  repeat_until_done boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_phases_project_id on public.phases(project_id);
create index if not exists idx_tasks_phase_id on public.tasks(phase_id);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.update_updated_at_column();

alter table public.projects enable row level security;
alter table public.phases enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "Public read projects" on public.projects;
create policy "Public read projects"
on public.projects for select
using (true);

drop policy if exists "Public write projects" on public.projects;
create policy "Public write projects"
on public.projects for all
using (true)
with check (true);

drop policy if exists "Public read phases" on public.phases;
create policy "Public read phases"
on public.phases for select
using (true);

drop policy if exists "Public write phases" on public.phases;
create policy "Public write phases"
on public.phases for all
using (true)
with check (true);

drop policy if exists "Public read tasks" on public.tasks;
create policy "Public read tasks"
on public.tasks for select
using (true);

drop policy if exists "Public write tasks" on public.tasks;
create policy "Public write tasks"
on public.tasks for all
using (true)
with check (true);

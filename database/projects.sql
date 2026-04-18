create table public.projects (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  name_ja text not null default ''::text,
  client text not null default ''::text,
  pm_id uuid null,
  client_id uuid null,
  description text not null default ''::text,
  description_ja text not null default ''::text,
  color text not null default 'from-brand-500 to-brand-700'::text,
  status public.project_status not null default 'active'::project_status,
  background text not null default ''::text,
  background_ja text not null default ''::text,
  purpose text not null default ''::text,
  purpose_ja text not null default ''::text,
  dev_period text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint projects_pkey primary key (id),
  constraint projects_client_id_fkey foreign KEY (client_id) references profiles (id) on delete set null,
  constraint projects_pm_id_fkey foreign KEY (pm_id) references profiles (id) on delete set null
) TABLESPACE pg_default;

create trigger trg_projects_updated_at BEFORE
update on projects for EACH row
execute FUNCTION set_updated_at ();
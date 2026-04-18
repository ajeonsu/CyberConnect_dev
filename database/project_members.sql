create table public.project_members (
  project_id uuid not null,
  profile_id uuid not null,
  constraint project_members_pkey primary key (project_id, profile_id),
  constraint project_members_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE,
  constraint project_members_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE
) TABLESPACE pg_default;
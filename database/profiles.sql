create table public.profiles (
  id uuid not null,
  name text not null,
  email text not null,
  role public.user_role not null default 'client'::user_role,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  extra_roles user_role[] not null default '{}'::user_role[],
  invited_by uuid null,
  status text not null default 'active'::text,
  avatar_url text not null default ''::text,
  department text not null default ''::text,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_invited_by_fkey foreign KEY (invited_by) references profiles (id),
  constraint profiles_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'active'::text,
          'suspended'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger trg_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION set_updated_at ();
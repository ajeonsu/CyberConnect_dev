-- Migration for backend architecture

-- Add workspace_type and owner_id to projects table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_type') THEN
        CREATE TYPE workspace_type AS ENUM ('team', 'personal');
    END IF;
END $$;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS workspace_type public.workspace_type NOT NULL DEFAULT 'team',
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure RLS is enabled on all tables for security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_list_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.function_list_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_case_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_chart_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_stack_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_func_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_list_rows ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (can be refined later)
-- For now, allow owners to see their personal projects and team members to see team projects.
-- This is just a draft SQL, implementation will use Server Actions initially.

-- RLS Policies for Backend Architecture
-- Run this in Supabase SQL Editor to allow authenticated users to manage data.

-- 1. Projects Table Policies
-- Allow users to see projects they own (personal) or all team projects.
CREATE POLICY "Allow select for owners or team" ON public.projects
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid() OR workspace_type = 'team');

-- Allow users to create projects (their ID will be automatically set by Server Action).
CREATE POLICY "Allow insert for authenticated users" ON public.projects
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update projects they own.
CREATE POLICY "Allow update for owners" ON public.projects
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid() OR workspace_type = 'team')
    WITH CHECK (owner_id = auth.uid() OR workspace_type = 'team');

-- Allow users to delete projects they own.
CREATE POLICY "Allow delete for owners" ON public.projects
    FOR DELETE TO authenticated
    USING (owner_id = auth.uid() OR (workspace_type = 'team' AND EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator', 'pm')
    )));


-- 2. Generic Policies for all Row tables
-- This is a helper to apply policies to all tables that link to projects.
-- Replace [TABLE_NAME] with each table name.

DO $$
DECLARE
    t text;
    row_tables text[] := ARRAY[
        'task_rows', 'screen_list_rows', 'function_list_rows', 
        'test_case_rows', 'backlog_rows', 'process_chart_rows', 
        'tech_stack_rows', 'non_func_rows', 'api_list_rows'
    ];
BEGIN
    FOREACH t IN ARRAY row_tables LOOP
        -- SELECT: Allow if user has access to the parent project
        EXECUTE format('CREATE POLICY "Allow select if project accessible" ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id));', t);
        
        -- INSERT: Allow if authenticated
        EXECUTE format('CREATE POLICY "Allow insert for authenticated" ON public.%I FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id));', t);
        
        -- UPDATE: Allow if authenticated
        EXECUTE format('CREATE POLICY "Allow update for authenticated" ON public.%I FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id));', t);
        
        -- DELETE: Allow if authenticated
        EXECUTE format('CREATE POLICY "Allow delete for authenticated" ON public.%I FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id));', t);
    END LOOP;
END $$;

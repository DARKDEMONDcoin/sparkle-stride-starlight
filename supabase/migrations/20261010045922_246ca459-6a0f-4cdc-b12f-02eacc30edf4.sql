create table public.inbound_emails (
  email_id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  employee_id text not null,
  sender text not null,
  subject text,
  status text not null default 'processing',
  created_at timestamptz not null default now()
);
grant all on public.inbound_emails to service_role;
alter table public.inbound_emails enable row level security;
create policy "Owners read their inbound emails" on public.inbound_emails
  for select to authenticated using (public.owns_workspace(workspace_id));
grant select on public.inbound_emails to authenticated;

create or replace function public.workspace_for_email(_email text)
returns table(workspace_id uuid, user_id uuid, full_name text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select w.id, u.id, p.full_name
  from auth.users u
  join public.workspaces w on w.owner_id = u.id and w.archived_at is null and w.kind <> 'project'
  left join public.profiles p on p.id = u.id
  where lower(u.email) = lower(_email) and u.email_confirmed_at is not null
  order by w.created_at asc
  limit 1
$$;
revoke all on function public.workspace_for_email(text) from public, anon, authenticated;
grant execute on function public.workspace_for_email(text) to service_role;
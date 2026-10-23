-- Comments for Nagy Notes.
--
-- Readers type a name (no sign-in). Anyone may read approved comments and add new ones;
-- nobody can edit or delete through the public API. Moderate in the Supabase dashboard
-- (or with the service role). To require approval first, change the default of
-- "approved" to false below.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  -- Post id, i.e. the path of the post without extension (e.g. apis/authentication/api-keys).
  post_slug text not null check (post_slug ~ '^[a-z0-9/_-]+$'),
  author_name text not null check (char_length(author_name) between 1 and 80),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  approved boolean not null default true,
  -- SHA-256 of the request IP, set by the trigger below for rate limiting. Never exposed.
  client_hash text
);

create index comments_post_slug_created_at_idx on public.comments (post_slug, created_at);
create index comments_client_hash_created_at_idx on public.comments (client_hash, created_at);

alter table public.comments enable row level security;

create policy "Anyone can read approved comments"
  on public.comments for select
  to anon, authenticated
  using (approved);

create policy "Anyone can add comments"
  on public.comments for insert
  to anon, authenticated
  with check (true);

-- Column-level privileges: the public API can only read the public columns and only write
-- the three user-supplied ones, so "approved" and "client_hash" always take their defaults.
revoke all on public.comments from anon, authenticated;
grant select (id, post_slug, author_name, body, created_at) on public.comments to anon, authenticated;
grant insert (post_slug, author_name, body) on public.comments to anon, authenticated;

-- Rate limit: at most 3 comments per client IP in any 10 minutes; only the IP's hash is stored.
-- The IP comes from cf-connecting-ip, which Cloudflare (in front of Supabase's API) sets and
-- clients cannot override. The first x-forwarded-for entry is only a fallback: a client can
-- prepend its own value there, so treat the limit as best effort.
create function public.comments_rate_limit()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  client_ip text := coalesce(
    nullif(trim(headers ->> 'cf-connecting-ip'), ''),
    trim(split_part(coalesce(headers ->> 'x-forwarded-for', ''), ',', 1))
  );
  hashed text;
begin
  if client_ip = '' then
    return new;
  end if;

  hashed := encode(sha256(convert_to(client_ip, 'UTF8')), 'hex');

  if (
    select count(*)
    from public.comments
    where client_hash = hashed
      and created_at > now() - interval '10 minutes'
  ) >= 3 then
    raise exception 'rate_limited';
  end if;

  new.client_hash := hashed;
  return new;
end;
$$;

revoke execute on function public.comments_rate_limit() from public, anon, authenticated;

create trigger comments_rate_limit
  before insert on public.comments
  for each row execute function public.comments_rate_limit();

-- 투표 테이블
create table polls (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  is_active boolean default true,
  allow_opinions boolean default true,
  created_at timestamptz default now()
);

-- 투표 항목 테이블
create table poll_options (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  text text not null,
  color text not null,
  order_index int not null,
  created_at timestamptz default now()
);

-- 투표 결과 테이블 (poll_id + session_id 중복 방지)
create table votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references poll_options(id) on delete cascade,
  session_id text not null,
  created_at timestamptz default now(),
  unique(poll_id, session_id)
);

-- 의견 테이블
create table opinions (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table votes enable row level security;
alter table opinions enable row level security;

-- 공개 읽기/쓰기 정책
create policy "Public read polls" on polls for select using (true);
create policy "Public insert polls" on polls for insert with check (true);
create policy "Public update polls" on polls for update using (true);
create policy "Public delete polls" on polls for delete using (true);

create policy "Public read options" on poll_options for select using (true);
create policy "Public insert options" on poll_options for insert with check (true);
create policy "Public delete options" on poll_options for delete using (true);

create policy "Public read votes" on votes for select using (true);
create policy "Public insert votes" on votes for insert with check (true);
create policy "Public delete votes" on votes for delete using (true);

create policy "Public read opinions" on opinions for select using (true);
create policy "Public insert opinions" on opinions for insert with check (true);
create policy "Public delete opinions" on opinions for delete using (true);

-- 실시간 기능 활성화
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table opinions;

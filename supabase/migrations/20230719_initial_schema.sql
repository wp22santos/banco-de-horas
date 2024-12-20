-- Drop existing tables if they exist
drop table if exists time_entries;
drop table if exists non_accounting_entries;

-- Create tables for time tracking app
create table time_entries (
  id bigint primary key generated by default as identity,
  date date not null,
  start_time time not null,
  end_time time not null,
  comment text,
  month int not null,
  year int not null,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table non_accounting_entries (
  id bigint primary key generated by default as identity,
  date date not null,
  type text not null,
  days int not null,
  comment text,
  month int not null,
  year int not null,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table time_entries enable row level security;
alter table non_accounting_entries enable row level security;

-- Create policies
create policy "Users can view their own time entries"
  on time_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own time entries"
  on time_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own time entries"
  on time_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own time entries"
  on time_entries for delete
  using (auth.uid() = user_id);

create policy "Users can view their own non-accounting entries"
  on non_accounting_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own non-accounting entries"
  on non_accounting_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own non-accounting entries"
  on non_accounting_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own non-accounting entries"
  on non_accounting_entries for delete
  using (auth.uid() = user_id);

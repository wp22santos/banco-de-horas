-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Drop existing views and tables if they exist
drop view if exists monthly_summary;
drop table if exists time_entries;
drop table if exists non_accounting_entries;

-- Create time_entries table
create table time_entries (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) not null,
    date date not null,
    month int not null,
    year int not null,
    start_time time not null,
    end_time time not null,
    night_time interval not null default '00:00:00', -- Tempo noturno em minutos
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Add constraints
    constraint time_entries_month_check check (month >= 1 and month <= 12),
    constraint time_entries_year_check check (year >= 2000)
    -- Removida a constraint de ordem do tempo para permitir turnos que passam da meia-noite
);

-- Create non_accounting_entries table
create table non_accounting_entries (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) not null,
    date date not null,
    month int not null,
    year int not null,
    type text not null,
    days int not null default 1,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Add constraints
    constraint non_accounting_entries_month_check check (month >= 1 and month <= 12),
    constraint non_accounting_entries_year_check check (year >= 2000),
    constraint non_accounting_entries_days_check check (days >= 1),
    constraint non_accounting_entries_type_check check (type in ('Férias', 'Feriado', 'Folga', 'Atestado', 'Outros'))
);

-- Modificar a função de cálculo de horas trabalhadas para lidar com turnos que passam da meia-noite
create or replace function calculate_worked_hours(
    p_month int,
    p_year int,
    p_user_id uuid
)
returns interval as $$
declare
    total_minutes int := 0;
    entry record;
    duration interval;
begin
    for entry in
        select date, start_time, end_time
        from time_entries
        where user_id = p_user_id
        and month = p_month
        and year = p_year
    loop
        -- Se o horário final for menor que o inicial, significa que passou da meia-noite
        if entry.end_time < entry.start_time then
            duration := ((entry.end_time + interval '24 hours') - entry.start_time);
        else
            duration := (entry.end_time - entry.start_time);
        end if;
        
        total_minutes := total_minutes + extract(epoch from duration)/60;
    end loop;
    
    return (total_minutes || ' minutes')::interval;
end;
$$ language plpgsql security definer;

-- Restante das definições de índices e políticas de segurança permanecem as mesmas
create index time_entries_user_id_idx on time_entries(user_id);
create index time_entries_date_idx on time_entries(date);
create index time_entries_month_year_idx on time_entries(month, year);
create index time_entries_user_month_year_idx on time_entries(user_id, month, year);

create index non_accounting_entries_user_id_idx on non_accounting_entries(user_id);
create index non_accounting_entries_date_idx on non_accounting_entries(date);
create index non_accounting_entries_month_year_idx on non_accounting_entries(month, year);
create index non_accounting_entries_user_month_year_idx on non_accounting_entries(user_id, month, year);

-- Triggers e políticas de segurança
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_time_entries_updated_at
    before update on time_entries
    for each row
    execute function update_updated_at_column();

create trigger update_non_accounting_entries_updated_at
    before update on non_accounting_entries
    for each row
    execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table time_entries enable row level security;
alter table non_accounting_entries enable row level security;

-- Create RLS policies
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

-- Recriar a view monthly_summary
create or replace view monthly_summary as
select 
    te.user_id,
    te.month,
    te.year,
    count(distinct te.date) as worked_days,
    calculate_working_days(te.month, te.year, te.user_id) as total_working_days,
    calculate_worked_hours(te.month, te.year, te.user_id) as total_worked_hours,
    (calculate_working_days(te.month, te.year, te.user_id) * interval '8 hours') as expected_hours,
    (calculate_worked_hours(te.month, te.year, te.user_id) - 
     (calculate_working_days(te.month, te.year, te.user_id) * interval '8 hours')) as balance_hours
from time_entries te
group by te.user_id, te.month, te.year;

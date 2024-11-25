-- Inserir o registro manualmente para testar
insert into monthly_hours (user_id, year, month, total_worked_minutes)
values ('c4a32a52-ce95-41ad-ba36-427f012df925', 2024, 1, 1650)
on conflict (user_id, year, month)
do update set total_worked_minutes = 1650;

-- Verificar se o registro foi inserido
select * from monthly_hours
where user_id = 'c4a32a52-ce95-41ad-ba36-427f012df925';

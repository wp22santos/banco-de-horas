# Changelog e Registro de Problemas

Este arquivo mantém um registro de problemas encontrados, suas soluções e aprendizados para referência futura.

## [2024-01-09] - Problema com Calendário no Modal

### Problema
O calendário não estava sendo exibido no NonAccountingEntryModal quando o modal era aberto.

### Sintomas
- O espaço para o calendário era criado, mas o componente não era renderizado
- Logs mostravam que o modal estava abrindo corretamente e o estado estava sendo gerenciado
- Nenhum erro era exibido no console

### Solução
1. Trocamos o componente `DatePicker` pelo `Calendar` diretamente
2. Removemos configurações complexas que estavam causando conflito
3. Simplificamos os estilos, usando o tema padrão "purple"
4. Adicionamos um container com padding e altura mínima fixa

### Código Anterior (com problema)
```tsx
<DatePicker
  value={selectedDates}
  onChange={(dates) => {
    if (Array.isArray(dates)) {
      setSelectedDates(dates.map(date => new Date(date)));
    }
  }}
  multiple
  format="DD/MM/YYYY"
  weekDays={["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]}
  months={["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]}
  className="rmdp-mobile"
  minDate={new Date()}
  inline
/>
```

### Código Corrigido
```tsx
<Calendar
  value={selectedDates}
  onChange={(dates: any) => {
    if (Array.isArray(dates)) {
      const newDates = dates.map(date => new Date(date));
      setSelectedDates(newDates);
    }
  }}
  multiple
  format="DD/MM/YYYY"
  weekDays={["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]}
  months={["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]}
  minDate={new Date()}
/>

## [2024-01-10] - Melhorias na Responsividade Mobile

### Problema
O layout estava sendo cortado em telas mobile, com problemas de scroll horizontal e espaçamento inadequado.

### Solução
1. Ajuste nos containers principais:
   - Redução do padding lateral em mobile (`px-4`)
   - Padding maior em telas desktop (`sm:px-6`)

2. Otimização dos grids de cards:
   - Layout em coluna única para mobile (`grid-cols-1`)
   - Três colunas em telas maiores (`sm:grid-cols-3`)
   - Espaçamento reduzido em mobile (`gap-4`)
   - Espaçamento maior em desktop (`sm:gap-8`)

### Código Atualizado
```tsx
// Containers principais
className="max-w-5xl mx-auto px-4 sm:px-6 py-6"

// Grids de cards
className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8"
```

### Resultados
- Eliminação do scroll horizontal em mobile
- Melhor organização dos cards em telas pequenas
- Transição suave entre layouts mobile e desktop
- Preservação da estrutura vertical dos elementos

## [2024-01-10] - Melhorias de Layout e Responsividade

### Ajustes
1. Posicionamento do botão Sair:
   - Aumentado espaçamento em relação ao topo
   - Melhor separação dos trimestres

2. Trimestres:
   - Centralização dos botões
   - Redução do padding lateral para melhor visualização
   - Removida rolagem horizontal

3. Cards de Informação:
   - Reorganização para layout horizontal
   - Melhor alinhamento dos ícones
   - Centralização dos elementos
   - Espaçamento consistente entre os cards

### Código Atualizado
```tsx
// Botão Sair
className="absolute right-6 top-4 mt-2"

// Container dos Cards
className="flex flex-wrap justify-center gap-6 w-full md:w-auto"
```

### Resultados
- Layout mais limpo e organizado
- Melhor experiência em dispositivos móveis
- Elementos perfeitamente alinhados e centralizados

## [2024-01-10] - Correção no Cálculo de Horas Previstas

### Problema
Os valores de horas previstas, trabalhadas e saldo estavam inconsistentes entre a página inicial (visão anual e trimestral) e as páginas individuais dos meses.

### Sintomas
- Na página inicial, os valores de horas previstas e saldo não correspondiam aos valores mostrados nas páginas dos meses
- O cálculo estava usando uma lógica simplificada de 8 horas por dia útil na visão anual e trimestral
- Nas páginas dos meses, o cálculo usava a fórmula correta: (160/total de dias) * dias úteis

### Solução
1. Unificada a lógica de cálculo em toda a aplicação usando a fórmula: (160/total de dias) * dias úteis
2. Atualizado o cálculo nos hooks:
   - useYearData.ts: atualizado para usar a mesma fórmula da página do mês
   - useQuarterData.ts: atualizado para calcular corretamente as horas previstas por mês
3. Agora todos os valores são consistentes em toda a aplicação

## [0.2.1] - 2024-03-26

### Fixed
- Corrigido bug onde algumas entradas de tempo tinham o mês incorreto devido ao uso de `getMonth()` que retorna valores de 0-11
- Implementada função `extractMonthAndYear` para extrair corretamente o mês e ano das datas
- Adicionada correção automática para entradas existentes com mês incorreto
- Atualizada a lógica de criação de novas entradas para garantir o cálculo correto do mês

## [Não publicado]

### Adicionado

### Corrigido
- Corrigido problema no calendário de lançamentos não contábeis que impedia a seleção de datas em meses anteriores ao atual
- Corrigido o calendário do modal de lançamentos não contábeis para abrir no mês correto
  - Substituído o uso de `new Date()` por `new DateObject()` nas props `defaultValue` e `currentDate`
  - Ajustado o formato do objeto para usar o mês corretamente (1-12)
  - Importado `DateObject` do `react-multi-date-picker`
- Corrigido o problema com turnos que passam da meia-noite, agora criando duas entradas automáticas (uma até 23:59 e outra começando à meia-noite)
- Implementada nova solução para turnos que passam da meia-noite:
  - O sistema agora cria automaticamente duas entradas (uma até 23:59:59 e outra começando em 00:00:00)
  - Corrigido o cálculo de horas trabalhadas para considerar os segundos
  - Exemplo: um turno das 18:00 às 06:00 agora mostra corretamente 12 horas (antes mostrava 11:59)
  - A primeira entrada termina exatamente em 23:59:59 e a segunda começa em 00:00:00
  - As horas são distribuídas corretamente entre os dias para relatórios diários/mensais
- Removida opção de editar lançamentos de turno, mantendo apenas a exclusão
- Corrigido cálculo de horas previstas para usar a fórmula (160/total de dias) * dias a trabalhar
- Melhorada exibição dos lançamentos não contábeis mostrando data, tipo e comentário
- Padronizado formato de datas para dd/mm/yyyy em todo o sistema

### Removido

### Aprendizados
1. O componente `Calendar` é mais simples e direto que o `DatePicker`
2. Excesso de configurações e estilos pode interferir na renderização
3. Às vezes, menos é mais - a solução mais simples pode ser a melhor
4. Importante manter logs para debug, mesmo quando não há erros aparentes

### Impacto
- Melhoria na experiência do usuário
- Calendário funcionando corretamente para seleção de múltiplas datas
- Interface mais limpa e consistente com o design do sistema

## [2024-04-29] - Erro na Busca de Turnos com Filtro de Data

### Problema
Tentativa de melhorar a busca de turnos que passam da meia-noite usando filtros de data causou erro na API do Supabase.

### Sintomas
- Erro ao buscar time entries: `invalid input syntax for type time: "start_time"`
- Requisição retornando status 400 (Bad Request)
- Query tentando comparar campos de hora diretamente não é suportada pelo Postgres

### Solução
1. Mantido o filtro original por mês/ano que já funcionava corretamente
2. Turnos que passam da meia-noite são tratados corretamente pela lógica de criação de duas entradas
3. Removida tentativa de usar comparação direta entre campos de hora na query

### Aprendizados
1. Nem todas as operações SQL são suportadas diretamente pelo Postgres/Supabase
2. A solução mais simples (filtro por mês/ano) já era suficiente
3. Importante testar queries complexas antes de implementar

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

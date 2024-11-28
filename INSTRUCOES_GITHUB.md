# Instruções para Configuração do Vercel com Vite e APIs Serverless

Este documento detalha os problemas encontrados e suas soluções ao configurar um projeto Vite com APIs serverless no Vercel.

## Estrutura do Projeto

```
projeto/
├── pages/
│   └── api/
│       └── webhook.ts               # Webhook (Next.js)
├── src/
│   └── ...                         # Código fonte do frontend (Vite)
├── .env                            # Variáveis de ambiente (desenvolvimento)
├── .env.local                      # Variáveis de ambiente (local)
├── package.json
└── vercel.json
```

## Variáveis de Ambiente Necessárias

### Supabase
```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### API URLs
```env
VITE_API_URL=http://localhost:5173     # Local
VITE_API_URL=https://seu-app.vercel.app # Produção
```

## Problemas Encontrados e Soluções

### 1. Erro: Versão do Node.js Inválida

**Erro:**
```
Error: Found invalid Node.js Version: "22.x"
```

**Solução:**
- Não especificar `nodeVersion` no vercel.json
- A versão do Node.js deve ser configurada nas configurações do projeto no dashboard do Vercel
- Use Node.js 18.x para compatibilidade com todas as dependências

### 2. Erro: Runtime sem Versão Específica

**Erro:**
```
Error: Function Runtimes must have a valid version
```

**Solução:**
1. Verifique a versão do @vercel/node no package.json:
```json
{
  "devDependencies": {
    "@vercel/node": "^3.2.27"
  }
}
```

2. Use exatamente a mesma versão no vercel.json:
```json
{
  "functions": {
    "api/*.ts": {
      "runtime": "@vercel/node@3.2.27"
    }
  }
}
```

### 3. Erro: Configuração Incorreta de APIs

**Problema:**
Mistura de APIs serverless (@vercel/node) com APIs Next.js (/pages/api)

**Solução:**
1. Mantenha as APIs na pasta `/api/`:
```json
{
  "rewrites": [
    {
      "source": "/api/products",
      "destination": "/api/products"
    }
  ]
}
```

2. Configure o runtime apenas para os arquivos necessários:
```json
{
  "functions": {
    "api/*.ts": {
      "runtime": "@vercel/node@3.2.27"
    }
  }
}
```

## Configuração Final do vercel.json

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/*.ts": {
      "runtime": "@vercel/node@3.2.27"
    }
  },
  "rewrites": [
    {
      "source": "/api/products",
      "destination": "/api/products"
    },
    {
      "source": "/webhook",
      "destination": "/api/webhook"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

## Pontos Importantes

1. **Framework**: Use `"framework": "vite"` já que o projeto principal usa Vite, não Next.js

2. **APIs Serverless**:
   - Use a pasta `/api/` para funções serverless com @vercel/node
   - Especifique a versão exata do runtime
   - Configure os rewrites corretamente

3. **Webhooks**:
   - Se estiver usando Next.js para webhooks, mantenha-os em `/pages/api/`
   - Se mudar para serverless, mova para `/api/` e atualize os rewrites

4. **Dependências**:
   - Mantenha @vercel/node nas devDependencies
   - Use a mesma versão no package.json e vercel.json

5. **Cache e Headers**:
   - Configure headers apropriados para cache
   - Use `must-revalidate` para conteúdo dinâmico

6. **Variáveis de Ambiente**:
   - Configure todas as variáveis no dashboard do Vercel
   - Use `.env.local` para desenvolvimento local
   - Nunca commite arquivos `.env` com chaves secretas

7. **CORS e Segurança**:
   - Configure CORS adequadamente nas APIs
   - Use HTTPS em produção
   - Proteja rotas sensíveis com autenticação

## Processo de Deploy

### Preparação Local
1. Teste todas as APIs localmente
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Confirme que o build local funciona: `npm run build`

### GitHub
1. Crie `.gitignore` adequado:
   ```gitignore
   node_modules/
   dist/
   .env
   .env.local
   .vercel
   ```
2. Commit suas alterações
3. Push para o GitHub

### Vercel
1. Conecte o repositório no Vercel
2. Configure as variáveis de ambiente no dashboard
3. Configure a versão do Node.js para 18.x
4. Faça o deploy inicial
5. Verifique os logs do build
6. Teste todas as rotas após o deploy

## Rotas e Testes com ngrok

### Estrutura de Rotas

#### Desenvolvimento Local (com ngrok)
```
Frontend (Vite): http://localhost:5173
API Local: http://localhost:5173/api/*
Webhook (ngrok): https://xxxx-xxx-xxx-xxx.ngrok.app/webhook
```

#### Produção (Vercel)
```
Frontend: https://seu-app.vercel.app
API: https://seu-app.vercel.app/api/*
Webhook: https://seu-app.vercel.app/webhook
```

### Configuração do ngrok

1. **Instalação**:
   ```bash
   npm install -g ngrok
   ```

2. **Expor Porta Local**:
   ```bash
   ngrok http 5173
   ```

3. **Configuração do Webhook**:
   - Acesse o dashboard do Stripe
   - Vá em Developers > Webhooks
   - Adicione endpoint: `https://xxxx-xxx-xxx-xxx.ngrok.app/webhook`
   - Selecione os eventos: `payment_intent.succeeded`, etc.

### Variáveis de Ambiente para Testes

#### Local com ngrok (.env.local)
```env
VITE_API_URL=http://localhost:5173
```

#### Produção no Vercel
```env
VITE_API_URL=https://seu-app.vercel.app
```

### Testando Webhooks

1. **Iniciar Ambiente Local**:
   ```bash
   npm run dev
   ```

2. **Iniciar ngrok**:
   ```bash
   ngrok http 5173
   ```

3. **Atualizar URL no Stripe**:
   - Copie a URL do ngrok
   - Atualize no dashboard do Stripe
   - Verifique se os eventos estão configurados

4. **Testar em Produção**:
   - Faça um pagamento teste
   - Verifique os logs no Vercel
   - Confirme o recebimento dos eventos

### Troubleshooting

### Erros Comuns
1. **Build Fails**:
   - Verifique os logs do build
   - Confirme que todas as dependências estão instaladas
   - Verifique a versão do Node.js

2. **API 404**:
   - Verifique os rewrites no vercel.json
   - Confirme que as APIs estão na pasta correta
   - Verifique se o runtime está configurado corretamente

3. **Erro de CORS**:
   - Configure o CORS nas APIs
   - Verifique os headers de resposta
   - Use o domínio correto no frontend

4. **Variáveis de Ambiente**:
   - Verifique se estão configuradas no Vercel
   - Use os prefixos corretos (VITE_, NEXT_PUBLIC_)
   - Não use variáveis locais em produção

### Checklist de Verificação
1. [ ] Build local funciona
2. [ ] Todas as variáveis de ambiente configuradas
3. [ ] vercel.json configurado corretamente
4. [ ] APIs testadas localmente
5. [ ] CORS configurado
6. [ ] Autenticação implementada
7. [ ] Webhooks configurados
8. [ ] Logs de erro implementados

## Desenvolvimento Local

1. **Instalação**:
   ```bash
   npm install
   ```

2. **Configuração**:
   - Copie `.env.example` para `.env.local`
   - Configure as variáveis de ambiente

3. **Desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Build**:
   ```bash
   npm run build
   ```

5. **Preview**:
   ```bash
   npm run preview
   ```

## Monitoramento e Logs

1. **Vercel**:
   - Use o dashboard do Vercel para logs
   - Configure alertas de erro
   - Monitore o uso de funções serverless

2. **Supabase**:
   - Monitore queries no dashboard
   - Configure logs de autenticação
   - Verifique logs de função

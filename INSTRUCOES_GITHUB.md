# Instruções para Configuração do Vercel com Vite e APIs Serverless

Este documento detalha os problemas encontrados e suas soluções ao configurar um projeto Vite com APIs serverless no Vercel.

## Estrutura do Projeto

```
projeto/
├── api/
│   └── stripe/
│       ├── products.ts              # API Serverless do Stripe
│       └── create-checkout-session.ts
├── pages/
│   └── api/
│       └── webhook.ts               # Webhook (Next.js)
├── src/
│   └── ...                         # Código fonte do frontend (Vite)
├── package.json
└── vercel.json
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
    "api/stripe/*.ts": {
      "runtime": "@vercel/node@3.2.27"
    }
  }
}
```

### 3. Erro: Configuração Incorreta de APIs

**Problema:**
Mistura de APIs serverless (@vercel/node) com APIs Next.js (/pages/api)

**Solução:**
1. Mantenha as APIs do Stripe na pasta `/api/stripe/`:
```json
{
  "rewrites": [
    {
      "source": "/api/stripe/products",
      "destination": "/api/stripe/products"
    },
    {
      "source": "/api/stripe/create-checkout-session",
      "destination": "/api/stripe/create-checkout-session"
    }
  ]
}
```

2. Configure o runtime apenas para os arquivos necessários:
```json
{
  "functions": {
    "api/stripe/*.ts": {
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
    "api/stripe/*.ts": {
      "runtime": "@vercel/node@3.2.27"
    }
  },
  "rewrites": [
    {
      "source": "/api/stripe/products",
      "destination": "/api/stripe/products"
    },
    {
      "source": "/api/stripe/create-checkout-session",
      "destination": "/api/stripe/create-checkout-session"
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

## Processo de Deploy

1. Commit suas alterações
2. Push para o GitHub
3. O Vercel detectará as mudanças e iniciará o deploy
4. Verifique os logs do build para garantir que não há erros
5. Teste todas as rotas após o deploy

## Troubleshooting

Se encontrar erros:
1. Verifique os logs do build no Vercel
2. Confirme que todas as variáveis de ambiente estão configuradas
3. Verifique se as versões do runtime estão corretas
4. Teste as APIs localmente antes do deploy

# Implementação do Stripe em uma Aplicação React/TypeScript

Este guia fornece instruções detalhadas para implementar o Stripe em uma aplicação React com TypeScript.

## 1. Estrutura do Projeto

```
projeto/
├── src/
│   ├── components/
│   │   └── PaymentForm.tsx
│   ├── views/
│   │   └── PaymentPage.tsx
│   └── App.tsx
├── public/
│   ├── success.html
│   └── cancel.html
└── server.js
```

## 2. Dependências Necessárias

```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.2.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "stripe": "^14.8.0"
  }
}
```

Instalar com:
```bash
npm install @stripe/stripe-js cors express stripe
```

## 3. Configuração do Servidor (server.js)

```javascript
import Stripe from 'stripe';
import express from 'express';
import cors from 'cors';

const stripe = new Stripe('sua_chave_secreta_do_stripe', {
  apiVersion: '2023-10-16'
});

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());
app.use(express.static('public'));

const YOUR_DOMAIN = 'http://localhost:4242';

app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('Criando sessão de checkout...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Assinatura Premium',
              description: 'Acesso completo ao sistema',
            },
            unit_amount: 9990, // R$ 99,90
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });

    console.log('Sessão criada com sucesso:', session.id);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Erro detalhado:', error);
    res.status(500).json({ 
      error: 'Erro ao criar sessão de pagamento',
      details: error.message 
    });
  }
});

app.listen(4242, () => {
  console.log('Servidor rodando em http://localhost:4242');
});
```

## 4. Página de Pagamento (src/views/PaymentPage.tsx)

```typescript
import { useState } from 'react';

export function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar sessão de pagamento');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
      setError('Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Finalizar Pagamento
          </h1>
          <p className="mt-4 text-gray-600">
            Você será redirecionado para o checkout seguro do Stripe
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirecionando...' : 'Prosseguir para Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

## 5. Páginas de Sucesso e Cancelamento

### success.html
```html
<!DOCTYPE html>
<html>
<head>
  <title>Pagamento Concluído</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 h-screen flex items-center justify-center">
  <div class="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-md text-center">
    <div class="mb-4 text-green-500">
      <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    <h1 class="text-2xl font-bold text-gray-900 mb-4">Pagamento Concluído!</h1>
    <p class="text-gray-600 mb-8">Seu pagamento foi processado com sucesso.</p>
    <a href="/" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
      Voltar ao Início
    </a>
  </div>
</body>
</html>
```

### cancel.html
```html
<!DOCTYPE html>
<html>
<head>
  <title>Pagamento Cancelado</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 h-screen flex items-center justify-center">
  <div class="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-md text-center">
    <div class="mb-4 text-red-500">
      <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
    <h1 class="text-2xl font-bold text-gray-900 mb-4">Pagamento Cancelado</h1>
    <p class="text-gray-600 mb-8">O processo de pagamento foi cancelado.</p>
    <a href="/payment" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
      Tentar Novamente
    </a>
  </div>
</body>
</html>
```

## 6. Configuração do Stripe

1. Criar conta no [Stripe](https://stripe.com/br)
2. Obter as chaves de API no Dashboard do Stripe:
   - Chave publicável (`pk_test_...`) para o frontend
   - Chave secreta (`sk_test_...`) para o backend

## 7. Execução

1. Iniciar o servidor:
```bash
node server.js
```

2. Iniciar a aplicação React:
```bash
npm run dev
```

## 8. Testes

Cartões de teste disponíveis:

1. Pagamento com sucesso:
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVV: Qualquer número de 3 dígitos

2. Pagamento que requer autenticação:
   - Número: `4000 0025 0000 3155`

3. Cartão recusado:
   - Número: `4000 0000 0000 0002`

## 9. Considerações de Produção

1. Usar HTTPS
2. Configurar CORS adequadamente
3. Usar variáveis de ambiente para as chaves do Stripe
4. Implementar webhooks para processar eventos do Stripe
5. Adicionar tratamento de erros mais robusto
6. Implementar sistema de logs
7. Adicionar monitoramento de transações

## 10. Customização

O checkout do Stripe pode ser customizado através das opções do `stripe.checkout.sessions.create`. Consulte a [documentação oficial do Stripe](https://stripe.com/docs/api/checkout/sessions/create) para mais opções.

## Instruções de Configuração e Segurança

### Configuração Local

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure as variáveis de ambiente:**
- Crie um arquivo `.env.local` na raiz do projeto
- Copie o conteúdo do `.env.example`
- Preencha com suas chaves do Stripe:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave
STRIPE_SECRET_KEY=sk_test_sua_chave
STRIPE_WEBHOOK_SECRET=whsec_sua_chave
STRIPE_PRODUCT_ID=prod_seu_id
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

## Testes de Pagamento

### Cartões de Teste
- **Pagamento bem-sucedido**: 4242 4242 4242 4242
- **Pagamento requer autenticação**: 4000 0025 0000 3155
- **Pagamento recusado**: 4000 0000 0000 9995

### Outros dados de teste
- **Data de validade**: Qualquer data futura
- **CVV**: Qualquer número de 3 dígitos
- **CEP**: Qualquer CEP válido

## Deploy na Vercel

### Pré-requisitos
1. Conta na Vercel
2. CLI da Vercel instalada:
```bash
npm i -g vercel
```

### Configuração das Variáveis de Ambiente
1. **Via CLI:**
```bash
vercel secrets add stripe_publishable_key pk_live_...
vercel secrets add stripe_secret_key sk_live_...
vercel secrets add stripe_webhook_secret whsec_...
```

2. **Via Dashboard:**
- Acesse o projeto na Vercel
- Vá em Settings > Environment Variables
- Adicione cada variável do `.env.local`

### Configuração do Webhook
1. No Dashboard do Stripe:
   - Vá em Developers > Webhooks
   - Adicione endpoint: `https://seu-dominio.vercel.app/webhook`
   - Selecione os eventos: `payment_intent.succeeded`, `payment_intent.failed`
   - Copie o Signing Secret para `STRIPE_WEBHOOK_SECRET`

### Deploy
```bash
vercel --prod
```

## Checklist de Segurança

### Antes do Deploy
- [ ] Remova todas as chaves de teste
- [ ] Configure as chaves de produção do Stripe
- [ ] Verifique se o `.env` está no `.gitignore`
- [ ] Configure o webhook com a URL correta
- [ ] Teste o fluxo completo em ambiente de staging

### Após o Deploy
- [ ] Verifique se HTTPS está ativo
- [ ] Teste um pagamento com cartão de teste
- [ ] Confirme que os webhooks estão funcionando
- [ ] Verifique os headers de segurança
- [ ] Monitore os logs de erro

## Monitoramento

### Stripe Dashboard
- Configure alertas para:
  - Tentativas de fraude
  - Disputas de pagamento
  - Erros de pagamento recorrentes
  - Webhooks com falha

### Logs
- Mantenha logs de:
  - Tentativas de pagamento (sem dados sensíveis)
  - Erros de processamento
  - Webhooks recebidos
  - Acessos não autorizados

## Manutenção

### Atualizações Regulares
```bash
# Verificar atualizações
npm outdated

# Atualizar dependências
npm update

# Atualizar dependências principais
npm install @stripe/stripe-js@latest @stripe/react-stripe-js@latest
```

### Backup
- Mantenha backup das configurações
- Documente todas as alterações
- Versione o código com git

## Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   - Verifique as origens permitidas no servidor
   - Confirme as configurações no `vercel.json`

2. **Webhook não recebido**
   - Verifique o Signing Secret
   - Confirme a URL do webhook
   - Verifique os logs do Stripe

3. **Pagamento não processado**
   - Verifique os logs do Stripe
   - Confirme as chaves de API
   - Teste com cartão de teste

## Suporte

### Links Úteis
- [Documentação do Stripe](https://stripe.com/docs)
- [Guia de Segurança do Stripe](https://stripe.com/docs/security)
- [Documentação da Vercel](https://vercel.com/docs)
- [Centro de Ajuda do Stripe](https://support.stripe.com)

### Contatos
- Suporte Stripe: support@stripe.com
- Suporte Vercel: support@vercel.com

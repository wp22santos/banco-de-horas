# Documentação sobre Assinaturas no Stripe

## Introdução
As assinaturas no Stripe permitem que você crie e gerencie planos de pagamento recorrentes para seus clientes. Esta documentação fornece uma visão geral de como implementar assinaturas usando a API do Stripe.

## Criando um Plano
Para criar um plano de assinatura, você deve usar a API do Stripe. Um plano é associado a um produto e define a frequência de cobrança.

### Exemplo de Código (Node.js)
```javascript
const stripe = require('stripe')('sua_chave_secreta');

const plano = await stripe.plans.create({
  amount: 2000, // valor em centavos
  interval: 'month', // 'day', 'week', 'month', 'year'
  product: 'id_do_produto',
});
```

## Criando uma Assinatura
Uma vez que você tenha um plano, pode criar uma assinatura para um cliente.

### Exemplo de Código (Node.js)
```javascript
const assinatura = await stripe.subscriptions.create({
  customer: 'id_do_cliente',
  items: [{ plan: 'id_do_plano' }],
});
```

## Gerenciando Assinaturas
Você pode atualizar ou cancelar assinaturas conforme necessário.

### Atualizando uma Assinatura
```javascript
const assinaturaAtualizada = await stripe.subscriptions.update('id_da_assinatura', {
  items: [{
    id: 'item_id',
    plan: 'novo_id_do_plano',
  }],
});
```

### Cancelando uma Assinatura
```javascript
const assinaturaCancelada = await stripe.subscriptions.del('id_da_assinatura');
```

## Webhooks
Os webhooks permitem que você receba notificações sobre eventos relacionados a assinaturas, como cobranças bem-sucedidas ou falhas.

### Exemplo de Webhook
```javascript
const endpointSecret = 'seu_endpoint_secret';

app.post('/webhook', express.json(), (request, response) => {
  const event = request.body;

  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      // Lógica para lidar com pagamento bem-sucedido
      break;
    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      // Lógica para lidar com falha de pagamento
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  response.status(200).end();
});
```

## Conclusão
Esta documentação fornece uma visão geral básica sobre como trabalhar com assinaturas no Stripe. Para mais informações, consulte a [documentação oficial do Stripe](https://stripe.com/docs/billing/subscriptions).

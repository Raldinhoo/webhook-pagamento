const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 🟡 COLA AQUI SEUS DADOS DO PUSHOVER
const PUSHOVER_USER_KEY = 'usap3hfvkq5b81stj8ud9yihddejue';
const PUSHOVER_API_TOKEN = 'awmj6xwx7fgr7acd82wwtsm1ng6xet';

app.post('/webhook', async (req, res) => {
  const { event, timestamp, data } = req.body;

  if (event === 'order.paid') {
    const nome = data.name || 'Sem nome';
    const email = data.email || 'Sem email';
    const telefone = data.phone || 'Sem telefone';
    const pedidoID = data.id || 'Sem ID';
    const horario = new Date(timestamp).toLocaleString();

    const mensagem = `💰 Novo pagamento!
👤 Nome: ${nome}
📧 Email: ${email}
📞 Telefone: ${telefone}
🧾 Pedido: ${pedidoID}
🕒 Horário: ${horario}`;

    try {
      await axios.post('https://api.pushover.net/1/messages.json', {
        token: PUSHOVER_API_TOKEN,
        user: PUSHOVER_USER_KEY,
        message: mensagem,
        title: 'Pagamento Recebido ✅',
        priority: 1
      });

      console.log('✅ Notificação enviada!');
      res.send({ status: 'ok' });
    } catch (err) {
      console.error('❌ Erro no Pushover:', err.message);
      res.status(500).send({ erro: err.message });
    }
  } else {
    res.send({ status: 'ignorado', motivo: 'evento não é pagamento' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor rodando: http://localhost:3000/webhook');
});

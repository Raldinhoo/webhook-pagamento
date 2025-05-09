const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Variáveis de ambiente
const MANYCHAT_TOKEN = process.env.MANYCHAT_TOKEN;
const MANYCHAT_FLOW_ID = process.env.MANYCHAT_FLOW_ID;

app.post('/webhook', async (req, res) => {
  const { event, timestamp, data } = req.body;

  // Só processa se for pedido expirado
  if (event === 'order.expired') {
    const telefone = data?.user?.phone ?? '';

    if (!telefone) {
      console.log('⚠️ Pedido expirado, mas sem telefone — ignorado.');
      return res.send({ status: 'ignorado', motivo: 'sem telefone' });
    }

    const numeroLimpo = telefone.replace(/\D/g, '');

    try {
      await axios.post('https://api.manychat.com/fb/sending/sendFlow', {
        subscriber_phone: numeroLimpo,
        flow_id: MANYCHAT_FLOW_ID
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MANYCHAT_TOKEN}`
        }
      });

      console.log(`✅ Automação ManyChat disparada para ${numeroLimpo}`);
      res.send({ status: 'ok' });
    } catch (err) {
      console.error('❌ Erro ao disparar ManyChat:', err.response?.data || err.message);
      res.status(500).send({ erro: err.message });
    }
  } else {
    res.send({ status: 'ignorado', motivo: 'evento diferente' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Webhook de recuperação rodando na porta 3000');
});

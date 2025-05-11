const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY;
const PUSHOVER_TOKEN_SETUP = process.env.PUSHOVER_TOKEN_SETUP;
const PUSHOVER_TOKEN_DRONE = process.env.PUSHOVER_TOKEN_DRONE;

const getTokenByProduto = (titulo) => {
  if (titulo?.toLowerCase().includes('setup')) return PUSHOVER_TOKEN_SETUP;
  if (titulo?.toLowerCase().includes('drone')) return PUSHOVER_TOKEN_DRONE;
  return null;
};

app.post('/webhook', async (req, res) => {
  const { event, timestamp, data } = req.body;

  if (event === 'order.paid') {
    const nome = data?.user?.name ?? 'Sem nome';
    const telefone = data?.user?.phone ?? 'Sem telefone';
    const valor = data?.total ?? 0;
    const produto = data?.product?.title ?? 'Sem produto';
    const horario = new Date(timestamp).toLocaleString('pt-BR');

    const valorFormatado = `R$${valor.toFixed(2).replace('.', ',')}`;

    const utmSource = data?.params?.utmSource?.split('?')[0]?.trim() || '';
    const utmContent = data?.params?.utmContent?.trim() || '';
    const isNumeric = /^\d+$/.test(utmContent);
    const origem = isNumeric || !utmContent
      ? utmSource || 'origem-desconhecida'
      : `${utmSource} / ${utmContent}`;

    const token = getTokenByProduto(produto);

    const titulo = produto?.toLowerCase().includes('setup')
      ? 'Pagamento Recebido 🕹️✅'
      : produto?.toLowerCase().includes('drone')
      ? 'Pagamento Recebido 🚁✅'
      : 'Pagamento Recebido ✅';

    if (!token) {
      console.log('❌ Produto não identificado. Notificação não enviada.');
      return res.send({ status: 'ignorado', motivo: 'token não encontrado' });
    }

    const mensagem = `💰 Novo pagamento de ${valorFormatado}

🌍 Origem: ${origem}
👤 Nome: ${nome}
📞 Telefone: ${telefone}
🕒 Horário: ${horario}
📦 Produto: ${produto}`;

    try {
      await axios.post('https://api.pushover.net/1/messages.json', {
        token,
        user: PUSHOVER_USER_KEY,
        message: mensagem,
        title: titulo,
        priority: 1
      });

      console.log('✅ Notificação enviada!');
      res.send({ status: 'ok' });
    } catch (err) {
      console.error('❌ Erro ao enviar para o Pushover:', err.message);
      res.status(500).send({ erro: err.message });
    }
  } else {
    res.send({ status: 'ignorado', motivo: 'evento diferente' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});

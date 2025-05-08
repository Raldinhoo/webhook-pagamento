const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY;
const PUSHOVER_API_TOKEN = process.env.PUSHOVER_API_TOKEN;

app.post('/webhook', async (req, res) => {
  const { event, timestamp, data } = req.body;

  if (event === 'order.paid') {
    const nome = data?.user?.name ?? 'Sem nome';
    const telefone = data?.user?.phone ?? 'Sem telefone';
    const valor = data?.total ?? 0;
    const produto = data?.product?.title ?? '';
    const horario = new Date(timestamp).toLocaleString('pt-BR');

    const utmSource = data?.params?.utmSource ?? 'origem desconhecida';
    const utmMedium = data?.params?.utmMedium ?? 'mídia desconhecida';
    const origem = `${utmSource} / ${utmMedium}`;

    const valorFormatado = valor
      ? `R$${(valor).toFixed(2).replace('.', ',')}`
      : 'Valor não informado';

    const mensagem = `💰 Novo pagamento no valor de ${valorFormatado} via ${origem}
👤 Nome: ${nome}
📞 Telefone: ${telefone}
🕒 Horário: ${horario}`;

    const token = getTokenByProduto(produto); // sua função já existente pra separar apps

    if (!token) {
      console.log('❌ Produto não identificado. Notificação não enviada.');
      return res.send({ status: 'ignorado', motivo: 'token não encontrado' });
    }

    try {
      await axios.post('https://api.pushover.net/1/messages.json', {
        token,
        user: PUSHOVER_USER_KEY,
        message: mensagem,
        title: `Pagamento | ${produto}`,
        priority: 1
      });

      console.log('✅ Notificação enviada!');
      res.send({ status: 'ok' });
    } catch (err) {
      console.error('❌ Erro no Pushover:', err.message);
      res.status(500).send({ erro: err.message });
    }
  } else {
    res.send({ status: 'ignorado', motivo: 'evento diferente' });
  }
});

  

app.listen(3000, () => {
  console.log('🚀 Servidor rodando: http://localhost:3000/webhook');
});

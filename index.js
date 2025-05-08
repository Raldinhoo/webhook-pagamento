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
      const horario = new Date(timestamp).toLocaleString('pt-BR');
  
      const valorFormatado = valor
        ? `R$${(valor).toFixed(2).replace('.', ',')}`
        : 'Valor não informado';
  
      const mensagem = `💰 Novo pagamento no valor de ${valorFormatado}!
  👤 Nome: ${nome}
  📞 Telefone: ${telefone}
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
      res.send({ status: 'ignorado', motivo: 'Evento diferente de order.paid' });
    }
  });
  

app.listen(3000, () => {
  console.log('🚀 Servidor rodando: http://localhost:3000/webhook');
});

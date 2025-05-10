const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY;
const PUSHOVER_TOKEN_SETUP = process.env.PUSHOVER_TOKEN_SETUP;
const PUSHOVER_TOKEN_DRONE = process.env.PUSHOVER_TOKEN_DRONE;

let totalSetup = 0;
let totalDrone = 0;
let dataAtual = new Date().toLocaleDateString('pt-BR');

const getTokenByProduto = (titulo) => {
  if (titulo?.toLowerCase().includes('setup')) return PUSHOVER_TOKEN_SETUP;
  if (titulo?.toLowerCase().includes('drone')) return PUSHOVER_TOKEN_DRONE;
  return null;
};

const getTipoProduto = (titulo) => {
  if (titulo?.toLowerCase().includes('setup')) return 'setup';
  if (titulo?.toLowerCase().includes('drone')) return 'drone';
  return 'outro';
};

app.post('/webhook', async (req, res) => {
  const { event, timestamp, data } = req.body;

  if (event === 'order.paid') {
    const hoje = new Date().toLocaleDateString('pt-BR');
    if (hoje !== dataAtual) {
      totalSetup = 0;
      totalDrone = 0;
      dataAtual = hoje;
    }

    const nome = data?.user?.name ?? 'Sem nome';
    const telefone = data?.user?.phone ?? 'Sem telefone';
    const valor = data?.total ?? 0;
    const produto = data?.product?.title ?? '';
    const horario = new Date(timestamp).toLocaleString('pt-BR');

    const utmSourceRaw = data?.params?.utmSource ?? '';
    const utmContentRaw = data?.params?.utmContent ?? '';
    const utmSource = utmSourceRaw.split('?')[0].trim();
    const utmContent = utmContentRaw.trim();
    const isNumeric = /^\d+$/.test(utmContent);

    let origem = '';
    if (utmSource && utmContent) {
      origem = isNumeric ? utmSource : `${utmSource} / ${utmContent}`;
    } else if (utmSource) {
      origem = utmSource;
    } else {
      origem = 'origem-desconhecida';
    }

    const valorFormatado = `R$${valor.toFixed(2).replace('.', ',')}`;
    const tipoProduto = getTipoProduto(produto);

    if (tipoProduto === 'setup') totalSetup += valor;
    if (tipoProduto === 'drone') totalDrone += valor;

    const mensagemBase = `👤 Nome: ${nome}
📞 Telefone: ${telefone}
🕒 Horário: ${horario}`;

    let titulo = '';
    let mensagem = '';

    if (valor >= 200) {
      titulo = '💣 EXPLOSÃO DE VENDA 💥🚀';
      mensagem = `🔥 Pagamento insano de ${valorFormatado} via ${origem}\n\n${mensagemBase}`;
    } else if (valor >= 100) {
      titulo = '🧨 VENDA MONSTRA 🔥✅';
      mensagem = `💰 Pagamento poderoso de ${valorFormatado} via ${origem}\n\n${mensagemBase}`;
    } else if (valor >= 50) {
      titulo = '💸 Boa venda realizada ✅';
      mensagem = `💰 Novo pagamento de ${valorFormatado} via ${origem}\n\n${mensagemBase}`;
    } else {
      titulo = tipoProduto === 'setup'
        ? 'Pagamento Recebido 🕹️✅'
        : tipoProduto === 'drone'
        ? 'Pagamento Recebido 🚁✅'
        : 'Pagamento Recebido ✅';

      mensagem = `💰 Novo pagamento no valor de ${valorFormatado} via ${origem}\n\n${mensagemBase}`;
    }

    if (tipoProduto === 'setup') {
      const totalFormatado = `R$${totalSetup.toFixed(2).replace('.', ',')}`;
      mensagem += `\n\n📊 Total SETUP hoje: ${totalFormatado}`;
    }

    if (tipoProduto === 'drone') {
      const totalFormatado = `R$${totalDrone.toFixed(2).replace('.', ',')}`;
      mensagem += `\n\n📊 Total DRONE hoje: ${totalFormatado}`;
    }

    const token = getTokenByProduto(produto);

    if (!token) {
      console.log('❌ Produto não identificado. Notificação não enviada.');
      return res.send({ status: 'ignorado', motivo: 'token não encontrado' });
    }

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
      console.error('❌ Erro no Pushover:', err.message);
      res.status(500).send({ erro: err.message });
    }
  } else {
    res.send({ status: 'ignorado', motivo: 'evento diferente' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});

if (event === 'order.paid') {
    const nome = data?.name ?? 'Sem nome';
    const telefone = data?.phone ?? 'Sem telefone';
    const valor = data?.amount ?? 0;
    const horario = new Date(timestamp).toLocaleString('pt-BR');
  
    const valorFormatado = valor
      ? `R$${(valor / 100).toFixed(2).replace('.', ',')}`
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
  }
  
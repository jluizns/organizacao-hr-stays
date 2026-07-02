import React, { useState, useEffect } from 'react';

export default function App() {
  const [reservas, setReservas] = useState([]);
  
  // Estados do Formulário
  const [hospede, setHospede] = useState('');
  const [origem, setOrigem] = useState('Airbnb');
  const [quarto, setQuarto] = useState('');
  const [valor, setValor] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Função para garantir formato YYYY-MM-DD exigido pelo Banco
  const formatarParaBanco = (dataString) => {
    if (!dataString) return '';
    // Se o input já mandar YYYY-MM-DD
    if (dataString.includes('-')) return dataString;
    // Caso algum navegador jogue DD/MM/AAAA
    if (dataString.includes('/')) {
      const [dia, mes, ano] = dataString.split('/');
      return `${ano}-${mes}-${dia}`;
    }
    return dataString;
  };

  // Função para calcular a diferença de dias entre check-in e check-out
  const calcularDias = (inDate, outDate) => {
    if (!inDate || !outDate) return 0;
    const inicio = new Date(formatarParaBanco(inDate) + 'T00:00:00');
    const fim = new Date(formatarParaBanco(outDate) + 'T00:00:00');
    const diferencaTempo = Math.abs(fim - inicio);
    return Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24)) || 1;
  };

  // Função para calcular o status em tempo real com base no Check-out
  const obterStatusCheckout = (outDate) => {
    if (!outDate) return 'Hoje';

    const hojeLocal = new Date();
    const ano = hojeLocal.getFullYear();
    const mes = String(hojeLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(hojeLocal.getDate()).padStart(2, '0');
    
    const hoje = new Date(`${ano}-${mes}-${dia}T00:00:00`);
    const dataFim = new Date(`${formatarParaBanco(outDate)}T00:00:00`);

    const diferencaTempo = dataFim - hoje;
    const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

    if (diferencaDias === 0) {
      return 'Sai hoje';
    } else if (diferencaDias === 1) {
      return 'Sai amanhã';
    } else if (diferencaDias > 1) {
      return `Sai em ${diferencaDias} dias`;
    } else {
      return 'Check-out encerrado';
    }
  };

  const carregarReservas = async () => {
    try {
      const res = await fetch('https://organizacao-hr-stays.onrender.com/api/reservas');
      const dados = await res.json();
      const dadosFormatados = dados.map(item => ({
        ...item,
        checkIn: item.check_in ? item.check_in.split('T')[0] : '',
        checkOut: item.check_out ? item.check_out.split('T')[0] : ''
      }));
      setReservas(dadosFormatados);
    } catch (err) {
      console.error('Erro ao buscar reservas do banco:', err);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hospede || !quarto || !valor || !checkIn || !checkOut) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    // Forçando a conversão limpa antes do envio
    const dataInFormatada = formatarParaBanco(checkIn);
    const dataOutFormatada = formatarParaBanco(checkOut);

    // Mapeamento duplo para suportar tanto camelCase quanto snake_case no Back-end
    const novaReserva = { 
      hospede: String(hospede).trim(), 
      quarto: String(quarto).trim(), 
      origem: String(origem), 
      valor: Number(valor), 
      check_in: dataInFormatada, 
      check_out: dataOutFormatada,
      checkIn: dataInFormatada,     
      checkOut: dataOutFormatada    
    };

    try {
      const respuesta = await fetch('https://organizacao-hr-stays.onrender.com/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaReserva)
      });

      // Captura a mensagem real enviada pelo servidor Node se o status não for 200/201
      if (!respuesta.ok) {
        const textoErro = await respuesta.text();
        alert(`Erro no Servidor (${respuesta.status}): ${textoErro || 'O back-end recusou os dados.'}`);
        return;
      }

      await carregarReservas();
      
      setHospede('');
      setQuarto('');
      setValor('');
      setCheckIn('');
      setCheckOut('');
      alert('Reserva salva com sucesso! 🎉');

    } catch (err) {
      console.error('Erro na requisição:', err);
      alert(`Falha de rede: Sem conexão com a API. Detalhe: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen p-4 font-sans md:p-6 bg-slate-900 text-slate-100">
      <header className="pb-4 mb-6 text-center border-b border-slate-800 md:text-left">
        <h1 className="text-2xl font-bold text-blue-400 md:text-3xl">HR Stays • Painel de Reservas</h1>
        <p className="mt-1 text-xs md:text-sm text-slate-400">Controle diário e fechamento mensal</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulário */}
        <div className="p-5 border shadow-lg md:p-6 bg-slate-800 rounded-xl h-fit border-slate-700">
          <h2 className="mb-4 text-lg font-semibold md:text-xl text-slate-200">Nova Reserva</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Nome do Hóspede</label>
              <input 
                type="text" 
                value={hospede} 
                onChange={e => setHospede(e.target.value)}
                className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Quarto</label>
                <input 
                  type="text" 
                  value={quarto}
                  onChange={e => setQuarto(e.target.value)}
                  className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  placeholder="Ex: 102"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Origem</label>
                <select 
                  value={origem}
                  onChange={e => setOrigem(e.target.value)}
                  className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Airbnb">Airbnb</option>
                  <option value="Booking">Booking</option>
                  <option value="Direto">Direto</option>
                  <option value="Despegar">Despegar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Valor da Reserva (Total)</label>
              <input 
                type="number" 
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="Ex: 450"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Check-in</label>
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Check-out</label>
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full p-3 mt-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-500">
              Salvar Reserva
            </button>
          </form>
        </div>

        {/* Tabela Responsiva */}
        <div className="p-5 border shadow-lg md:p-6 lg:col-span-2 bg-slate-800 rounded-xl border-slate-700">
          <h2 className="mb-4 text-lg font-semibold md:text-xl text-slate-200">Lista de Ocupação</h2>
          
          <div className="w-full overflow-x-auto border rounded-lg border-slate-700/50">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-xs font-semibold uppercase border-b bg-slate-900/50 border-slate-700 text-slate-400">
                  <th className="p-3 font-semibold">Hóspede</th>
                  <th className="p-3 font-semibold">Quarto</th>
                  <th className="p-3 font-semibold">Origem</th>
                  <th className="p-3 font-semibold">Dias</th>
                  <th className="p-3 font-semibold">Total</th>
                  <th className="p-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-700/50">
                {reservas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">Nenhuma reserva encontrada no MySQL.</td>
                  </tr>
                ) : (
                  reservas.map(reserva => (
                    <tr key={reserva.id} className="transition-colors hover:bg-slate-700/30">
                      <td className="p-3 font-medium text-slate-200">{reserva.hospede}</td>
                      <td className="p-3 text-slate-300">
                        <span className="px-2 py-1 font-mono text-xs border rounded bg-slate-900 border-slate-700">{reserva.quarto}</span>
                      </td>
                      <td className="p-3 text-slate-400">{reserva.origem}</td>
                      <td className="p-3 text-slate-400">
                        {calcularDias(reserva.checkIn, reserva.checkOut)} dias
                      </td>
                      <td className="p-3 font-medium text-emerald-400">
                        R$ {Number(reserva.valor).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          obterStatusCheckout(reserva.checkOut) === 'Sai hoje'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : obterStatusCheckout(reserva.checkOut) === 'Sai amanhã'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : obterStatusCheckout(reserva.checkOut) === 'Check-out encerrado'
                            ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {obterStatusCheckout(reserva.checkOut)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

export default function App() {
  const [reservas, setReservas] = useState([]);
  
  // Filtros de Data Avançados (Controlam os Cards e a Tabela)
  const [dataInicioFiltro, setDataInicioFiltro] = useState('');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('checkIn'); // 'checkIn' ou 'checkOut'
  
  // NOVO: Estado para a Aba de Controle Diário (Começa com o dia de hoje)
  const [dataControleDiario, setDataControleDiario] = useState('');

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
    if (dataString.includes('-')) return dataString;
    if (dataString.includes('/')) {
      const [dia, mes, ano] = dataString.split('/');
      return `${ano}-${mes}-${dia}`;
    }
    return dataString;
  };

  const calcularDias = (inDate, outDate) => {
    if (!inDate || !outDate) return 0;
    const inicio = new Date(formatarParaBanco(inDate) + 'T00:00:00');
    const fim = new Date(formatarParaBanco(outDate) + 'T00:00:00');
    const diferencaTempo = Math.abs(fim - inicio);
    return Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24)) || 1;
  };

  const obterHojeStringLocal = () => {
    const hojeLocal = new Date();
    const ano = hojeLocal.getFullYear();
    const mes = String(hojeLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(hojeLocal.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const obterStatusCheckout = (outDate) => {
    if (!outDate) return 'Hoje';
    const hoje = new Date(obterHojeStringLocal() + 'T00:00:00');
    const dataFim = new Date(`${formatarParaBanco(outDate)}T00:00:00`);
    const diferencaTempo = dataFim - hoje;
    const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

    if (diferencaDias === 0) return 'Sai hoje';
    if (diferencaDias === 1) return 'Sai amanhã';
    if (diferencaDias > 1) return `Sai em ${diferencaDias} dias`;
    return 'Check-out encerrado';
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

  // Inicializa a data do controle diário com o dia de hoje
  useEffect(() => {
    carregarReservas();
    setDataControleDiario(obterHojeStringLocal());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hospede || !quarto || !valor || !checkIn || !checkOut) {
      alert('Por favor, preencha todos os campos no ecrã!');
      return;
    }

    const novaReserva = { 
      hospede: String(hospede).trim(),
      quarto: String(quarto).trim(),
      origem: String(origem),
      valor: Number(valor),
      checkIn: formatarParaBanco(checkIn),
      checkOut: formatarParaBanco(checkOut)
    };

    try {
      const respuesta = await fetch('https://organizacao-hr-stays.onrender.com/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaReserva)
      });

      if (!respuesta.ok) {
        const textoErro = await respuesta.text();
        alert(`Erro no Servidor (${respuesta.status}): ${textoErro}`);
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
      alert(`Flha de rede: ${err.message}`);
    }
  };

  // --- LÓGICA DE FILTRAGEM AVANÇADA POR DATA (TABELA PRINCIPAL) ---
  const hojeStr = obterHojeStringLocal();

  const checkInsHoje = reservas.filter(r => r.checkIn === hojeStr);
  const checkOutsHoje = reservas.filter(r => r.checkOut === hojeStr);
  const hospedesAtivosHoje = reservas.filter(r => hojeStr >= r.checkIn && hojeStr <= r.checkOut);

  const reservasFiltradas = reservas.filter(r => {
    const dataAlvo = tipoFiltro === 'checkIn' ? r.checkIn : r.checkOut;
    
    if (dataInicioFiltro && dataAlvo < dataInicioFiltro) return false;
    if (dataFimFiltro && dataAlvo > dataFimFiltro) return false;
    
    return true;
  });

  const faturamentoPeriodo = reservasFiltradas.reduce((acc, curr) => acc + Number(curr.valor), 0);

  // NOVO: Filtragem exclusiva para os blocos de Entra/Sai do dia selecionado
  const checkInsDoDiaSelecionado = reservas.filter(r => r.checkIn === dataControleDiario);
  const checkOutsDoDiaSelecionado = reservas.filter(r => r.checkOut === dataControleDiario);

  const limparFiltros = () => {
    setDataInicioFiltro('');
    setDataFimFiltro('');
  };

  return (
    <div className="min-h-screen p-3 font-sans md:p-6 bg-slate-900 text-slate-100">
      <header className="flex flex-col items-center justify-between gap-3 pb-4 mb-6 text-center border-b border-slate-800 sm:flex-row sm:text-left">
        <div>
          <h1 className="text-xl font-bold text-blue-400 md:text-3xl">HR Stays • Painel de Reservas</h1>
          <p className="mt-0.5 text-xs text-slate-400">Controle diário e filtros personalizados</p>
        </div>
        <div className="text-[11px] bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-slate-300">
          📅 Hoje: {hojeStr.split('-').reverse().join('/')}
        </div>
      </header>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        <div className="p-3 border shadow-md bg-slate-800 rounded-xl border-slate-700">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">No Imóvel Hoje</p>
          <p className="mt-1 text-xl font-bold text-blue-400 md:text-2xl">{hospedesAtivosHoje.length}</p>
        </div>

        <div className="p-3 border shadow-md bg-slate-800 rounded-xl border-slate-700">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Check-ins Hoje</p>
          <p className="mt-1 text-xl font-bold text-emerald-400 md:text-2xl">{checkInsHoje.length}</p>
        </div>

        <div className="p-3 border shadow-md bg-slate-800 rounded-xl border-slate-700">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Check-outs Hoje</p>
          <p className="mt-1 text-xl font-bold text-amber-400 md:text-2xl">{checkOutsHoje.length}</p>
        </div>

        <div className="p-3 border shadow-md bg-slate-800 rounded-xl border-slate-700">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Faturamento Filtrado</p>
          <p className="mt-1 text-xl font-bold text-emerald-400 md:text-2xl">R$ {faturamentoPeriodo.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulário */}
        <div className="p-4 border shadow-lg md:p-6 bg-slate-800 rounded-xl h-fit border-slate-700">
          <h2 className="mb-4 text-base font-semibold md:text-xl text-slate-200">Nova Reserva</h2>
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

            <div className="grid grid-cols-2 gap-3">
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
              <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Valor da Reserva</label>
              <input 
                type="number" 
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="Ex: 450"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Check-in</label>
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full p-2 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Check-out</label>
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full p-2 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full p-3 mt-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-500">
              Salvar Reserva
            </button>
          </form>
        </div>

        {/* Listagem de Ocupação */}
        <div className="p-4 space-y-4 border shadow-lg md:p-6 lg:col-span-2 bg-slate-800 rounded-xl border-slate-700">
          
          {/* 🔍 NOVO: COMPONENTENTE DE VISÃO DIÁRIA INTERATIVA */}
          <div className="p-3 border rounded-xl bg-slate-900/40 border-slate-700/80">
            <div className="flex flex-col justify-between gap-2 pb-2 mb-3 border-b sm:flex-row sm:items-center border-slate-700/60">
              <span className="text-xs font-bold tracking-wide text-blue-400 uppercase">📋 Movimentação por Dia Selecionado</span>
              <input 
                type="date" 
                value={dataControleDiario}
                onChange={e => setDataControleDiario(e.target.value)}
                className="p-1.5 text-xs text-white border rounded-lg bg-slate-800 border-slate-700 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Entradas */}
              <div className="p-2 border rounded-lg bg-slate-900/50 border-emerald-500/10">
                <p className="text-[11px] font-bold text-emerald-400 uppercase mb-1">📥 Entrando no dia ({checkInsDoDiaSelecionado.length})</p>
                {checkInsDoDiaSelecionado.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nenhum check-in.</p>
                ) : (
                  <div className="space-y-1">
                    {checkInsDoDiaSelecionado.map(r => (
                      <div key={r.id} className="flex justify-between p-1 text-xs rounded text-slate-300 bg-slate-800/50">
                        <span>{r.hospede}</span>
                        <span className="font-mono text-[11px] bg-slate-900 px-1 rounded text-slate-400">Quarto {r.quarto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saídas */}
              <div className="p-2 border rounded-lg bg-slate-900/50 border-amber-500/10">
                <p className="text-[11px] font-bold text-amber-400 uppercase mb-1">📤 Saindo no dia ({checkOutsDoDiaSelecionado.length})</p>
                {checkOutsDoDiaSelecionado.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nenhum check-out.</p>
                ) : (
                  <div className="space-y-1">
                    {checkOutsDoDiaSelecionado.map(r => (
                      <div key={r.id} className="flex justify-between p-1 text-xs rounded text-slate-300 bg-slate-800/50">
                        <span>{r.hospede}</span>
                        <span className="font-mono text-[11px] bg-slate-900 px-1 rounded text-slate-400">Quarto {r.quarto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PAINEL DE FILTROS AVANÇADOS (Ajuste Mensal da Tabela) */}
          <div className="p-3 space-y-3 border rounded-xl bg-slate-900/60 border-slate-700/60">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-300">Filtros de Período (Tabela e Caixa)</span>
              {(dataInicioFiltro || dataFimFiltro) && (
                <button onClick={limparFiltros} className="text-[11px] text-red-400 hover:underline text-left">
                  ✕ Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Filtrar por:</label>
                <select
                  value={tipoFiltro}
                  onChange={e => setTipoFiltro(e.target.value)}
                  className="w-full p-2 text-xs text-white border rounded-lg bg-slate-800 border-slate-700 focus:outline-none"
                >
                  <option value="checkIn">Data de Check-in</option>
                  <option value="checkOut">Data de Check-out</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">De:</label>
                <input
                  type="date"
                  value={dataInicioFiltro}
                  onChange={e => setDataInicioFiltro(e.target.value)}
                  className="w-full p-2 text-xs text-white border rounded-lg bg-slate-800 border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Até:</label>
                <input
                  type="date"
                  value={dataFimFiltro}
                  onChange={e => setDataFimFiltro(e.target.value)}
                  className="w-full p-2 text-xs text-white border rounded-lg bg-slate-800 border-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <h2 className="hidden mb-3 text-base font-semibold text-slate-200 md:block">Lista de Ocupação</h2>
          
          {/* VISÃO PARA TELAS PEQUENAS (CELULAR): Lista de Cards empilhados */}
          <div className="block space-y-3 md:hidden">
            {reservasFiltradas.length === 0 ? (
              <p className="py-6 text-sm text-center text-slate-500">Nenhuma reserva encontrada no período.</p>
            ) : (
              reservasFiltradas.map(reserva => (
                <div key={reserva.id} className="p-3 space-y-2 border bg-slate-900/50 rounded-xl border-slate-700/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{reserva.hospede}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        📅 {reserva.checkIn.split('-').reverse().join('/')} até {reserva.checkOut.split('-').reverse().join('/')}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 font-mono text-xs border rounded bg-slate-800 border-slate-700 text-slate-300">
                      Q: {reserva.quarto}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-800">
                    <span className="text-slate-400">{reserva.origem} • {calcularDias(reserva.checkIn, reserva.checkOut)} dias</span>
                    <span className="font-bold text-emerald-400">R$ {Number(reserva.valor).toFixed(2)}</span>
                  </div>

                  <div className="pt-1 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
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
                  </div>
                </div>
              ))
            )}
          </div>

          {/* VISÃO PARA TELAS GRANDES (PC/TABLET): Tabela Tradicional */}
          <div className="hidden w-full overflow-x-auto border rounded-lg md:block border-slate-700/50">
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
                {reservasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">Nenhuma reserva encontrada para os filtros selecionados.</td>
                  </tr>
                ) : (
                  reservasFiltradas.map(reserva => (
                    <tr key={reserva.id} className="transition-colors hover:bg-slate-700/30">
                      <td className="p-3 font-medium text-slate-200">
                        {reserva.hospede}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {reserva.checkIn.split('-').reverse().join('/')} até {reserva.checkOut.split('-').reverse().join('/')}
                        </div>
                      </td>
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
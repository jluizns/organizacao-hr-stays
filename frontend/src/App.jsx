import React, { useState, useEffect } from 'react';

export default function App() {
  const [reservas, setReservas] = useState([]);
  
  // Filtros de Data Avançados (Tabela e Caixa)
  const [dataInicioFiltro, setDataInicioFiltro] = useState('');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('checkIn');
  
  // Estado para o Calendário Visual (Controla o mês/ano exibido e o dia selecionado)
  const [dataControleDiario, setDataControleDiario] = useState('');
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  // Estados do Formulário
  const [hospede, setHospede] = useState('');
  const [origem, setOrigem] = useState('Airbnb');
  const [quarto, setQuarto] = useState('');
  const [valor, setValor] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const nomesDosMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

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

  useEffect(() => {
    carregarReservas();
    setDataControleDiario(obterHojeStringLocal());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hospede || !quarto || !valor || !checkIn || !checkOut) {
      alert('Por favor, preencha todos os campos!');
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

      if (!respuesta.ok) return alert('Erro ao salvar reserva.');

      await carregarReservas();
      setHospede('');
      setQuarto('');
      setValor('');
      setCheckIn('');
      setCheckOut('');
      alert('Reserva salva com sucesso! 🎉');
    } catch (err) {
      console.error(err);
    }
  };

  // --- CÁLCULO DE FLUXO E FILTROS ---
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

  const checkInsDoDiaSelecionado = reservas.filter(r => r.checkIn === dataControleDiario);
  const checkOutsDoDiaSelecionado = reservas.filter(r => r.checkOut === dataControleDiario);

  // --- LÓGICA DE GERAÇÃO DO CALENDÁRIO VISUAL ---
  const obterDiasDoMes = () => {
    const primeiroDiaDaSemana = new Date(anoAtual, mesAtual, 1).getDay();
    const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
    
    const matrizDias = [];
    // Preenche espaços em branco do mês anterior
    for (let i = 0; i < primeiroDiaDaSemana; i++) {
      matrizDias.push(null);
    }
    // Preenche os dias reais do mês
    for (let dia = 1; dia <= totalDiasNoMes; dia++) {
      matrizDias.push(dia);
    }
    return matrizDias;
  };

  const mudarMes = (direcao) => {
    if (direcao === 'voltar') {
      if (mesAtual === 0) {
        setMesAtual(11);
        setAnoAtual(prev => prev - 1);
      } else {
        setMesAtual(prev => prev - 1);
      }
    } else {
      if (mesAtual === 11) {
        setMesAtual(0);
        setAnoAtual(prev => prev + 1);
      } else {
        setMesAtual(prev => prev + 1);
      }
    }
  };

  const selecionarDiaCalendario = (dia) => {
    if (!dia) return;
    const mesFormatado = String(mesAtual + 1).padStart(2, '0');
    const diaFormatado = String(dia).padStart(2, '0');
    setDataControleDiario(`${anoAtual}-${mesFormatado}-${diaFormatado}`);
  };

  const verificarMovimentacaoNoDia = (dia) => {
    if (!dia) return { temCheckIn: false, temCheckOut: false };
    const mesFormatado = String(mesAtual + 1).padStart(2, '0');
    const diaFormatado = String(dia).padStart(2, '0');
    const dataStr = `${anoAtual}-${mesFormatado}-${diaFormatado}`;
    
    return {
      temCheckIn: reservas.some(r => r.checkIn === dataStr),
      temCheckOut: reservas.some(r => r.checkOut === dataStr)
    };
  };

  return (
    <div className="min-h-screen p-3 font-sans md:p-6 bg-slate-900 text-slate-100">
      <header className="flex flex-col items-center justify-between gap-3 pb-4 mb-6 text-center border-b border-slate-800 sm:flex-row sm:text-left">
        <div>
          <h1 className="text-xl font-bold text-blue-400 md:text-3xl">HR Stays • Painel de Reservas</h1>
          <p className="mt-0.5 text-xs text-slate-400">Controle diário em calendário interativo</p>
        </div>
        <div className="text-[11px] bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-slate-300">
          📅 Hoje: {hojeStr.split('-').reverse().join('/')}
        </div>
      </header>

      {/* CARDS DE RESUMO (Faturamento lá em cima) */}
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
        <div className="p-3 border shadow-md bg-slate-800 rounded-xl border-slate-700 bg-gradient-to-br from-slate-800 to-slate-800/40 border-emerald-500/20">
          <p className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wider">Faturamento Filtrado</p>
          <p className="mt-1 text-xl font-bold text-emerald-400 md:text-2xl">R$ {faturamentoPeriodo.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* COLUNA 1: FORMULÁRIO */}
        <div className="p-4 border shadow-lg bg-slate-800 rounded-xl h-fit border-slate-700">
          <h2 className="mb-4 text-base font-semibold text-slate-200">Nova Reserva</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Nome do Hóspede</label>
              <input type="text" value={hospede} onChange={e => setHospede(e.target.value)} className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:outline-none" placeholder="Ex: João Silva" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Quarto</label>
                <input type="text" value={quarto} onChange={e => setQuarto(e.target.value)} className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:outline-none" placeholder="Ex: 102" />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Origem</label>
                <select value={origem} onChange={e => setOrigem(e.target.value)} className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:outline-none">
                  <option value="Airbnb">Airbnb</option>
                  <option value="Booking">Booking</option>
                  <option value="Direto">Direto</option>
                  <option value="Despegar">Despegar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Valor da Reserva</label>
              <input type="number" value={valor} onChange={e => setValor(e.target.value)} className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:outline-none" placeholder="Ex: 450" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Check-in</label>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full p-2 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Check-out</label>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full p-2 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:outline-none" />
              </div>
            </div>

            <button type="submit" className="w-full p-3 mt-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-500">
              Salvar Reserva
            </button>
          </form>
        </div>

        {/* COLUNAS 2 E 3: CALENDÁRIO + MESTRE DE CONTROLE */}
        <div className="space-y-4 lg:col-span-2">
          
          {/* 📅 GRID: CALENDÁRIO COMPLETO + STATUS DO DIA SELECIONADO */}
          <div className="grid grid-cols-1 gap-4 p-4 border shadow-lg md:grid-cols-5 bg-slate-800 rounded-xl border-slate-700">
            
            {/* Bloco Esquerdo: Calendário Grid (Ocupa 3 partições do espaço) */}
            <div className="pr-0 border-r md:col-span-3 border-slate-700/50 md:pr-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => mudarMes('voltar')} className="p-1 px-2 text-xs border rounded bg-slate-900 hover:bg-slate-700 text-slate-300 border-slate-700">◀</button>
                <span className="font-mono text-sm font-bold text-slate-200">{nomesDosMeses[mesAtual]} {anoAtual}</span>
                <button onClick={() => mudarMes('avancar')} className="p-1 px-2 text-xs border rounded bg-slate-900 hover:bg-slate-700 text-slate-300 border-slate-700">▶</button>
              </div>

              {/* Dias da semana cabeçalho */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
              </div>

              {/* Dias do Mês */}
              <div className="grid grid-cols-7 gap-1">
                {obterDiasDoMes().map((dia, index) => {
                  if (dia === null) return <div key={`empty-${index}`} className="h-8"></div>;

                  const mesFmt = String(mesAtual + 1).padStart(2, '0');
                  const diaFmt = String(dia).padStart(2, '0');
                  const estaDataStr = `${anoAtual}-${mesFmt}-${diaFmt}`;
                  const isSelecionado = dataControleDiario === estaDataStr;
                  const { temCheckIn, temCheckOut } = verificarMovimentacaoNoDia(dia);

                  return (
                    <button
                      key={`day-${dia}`}
                      onClick={() => selecionarDiaCalendario(dia)}
                      className={`h-8 text-xs font-semibold rounded-lg relative flex flex-col items-center justify-center transition-all ${
                        isSelecionado 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span>{dia}</span>
                      {/* Indicadores Visuais Discretos de fluxo no quadradinho do dia */}
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {temCheckIn && <span className="w-1 h-1 rounded-full bg-emerald-400"></span>}
                        {temCheckOut && <span className="w-1 h-1 rounded-full bg-amber-400"></span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco Direito: Detalhes do Dia Selecionado (Ocupa 2 partições do espaço) */}
            <div className="flex flex-col justify-between space-y-3 md:col-span-2">
              <div>
                <p className="text-[11px] font-bold uppercase text-blue-400 tracking-wider">
                  📍 Dia: {dataControleDiario.split('-').reverse().join('/')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Fluxos agendados para este clique:</p>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px]">
                {/* Entradas */}
                <div className="p-2 border rounded-lg bg-slate-900/60 border-emerald-500/10">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">📥 Check-ins ({checkInsDoDiaSelecionado.length})</span>
                  {checkInsDoDiaSelecionado.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">Vazio</p>
                  ) : (
                    checkInsDoDiaSelecionado.map(r => (
                      <div key={r.id} className="text-xs text-slate-300 flex justify-between py-0.5 border-b border-slate-800 last:border-0">
                        <span className="truncate max-w-[90px]">{r.hospede}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Q: {r.quarto}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Saídas */}
                <div className="p-2 border rounded-lg bg-slate-900/60 border-amber-500/10">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1">📤 Check-outs ({checkOutsDoDiaSelecionado.length})</span>
                  {checkOutsDoDiaSelecionado.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">Vazio</p>
                  ) : (
                    checkOutsDoDiaSelecionado.map(r => (
                      <div key={r.id} className="text-xs text-slate-300 flex justify-between py-0.5 border-b border-slate-800 last:border-0">
                        <span className="truncate max-w-[90px]">{r.hospede}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Q: {r.quarto}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* PAINEL DE FILTROS DO PERÍODO */}
          <div className="p-3 space-y-3 border rounded-xl bg-slate-900/60 border-slate-700/60">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-300">Filtros de Período (Tabela Geral)</span>
              {(dataInicioFiltro || dataFimFiltro) && (
                <button onClick={() => { setDataInicioFiltro(''); setDataFimFiltro(''); }} className="text-[11px] text-red-400 hover:underline">
                  ✕ Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Filtrar por:</label>
                <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className="w-full p-2 text-xs text-white border rounded-lg bg-slate-800 border-slate-700 focus:outline-none">
                  <option value="checkIn">Data de Check-in</option>
                  <option value="checkOut">Data de Check-out</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">De:</label>
                <input type="date" value={dataInicioFiltro} onChange={e => setDataInicioFiltro(e.target.value)} className="w-full p-2 text-xs text-white border rounded-lg bg-slate-800 border-slate-700 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Até:</label>
                <input type="date" value={dataFimFiltro} onChange={e => setDataFimFiltro(e.target.value)} className="w-full p-2 text-xs text-white border rounded-lg bg-slate-800 border-slate-700 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* TABELA DE OCUPAÇÃO TRADICIONAL */}
          <h2 className="hidden mt-2 text-base font-semibold text-slate-200 md:block">Lista de Ocupação Histórica</h2>
          
          {/* Mobile Stack view */}
          <div className="block space-y-3 md:hidden">
            {reservasFiltradas.length === 0 ? (
              <p className="py-6 text-sm text-center text-slate-500">Nenhuma reserva encontrada.</p>
            ) : (
              reservasFiltradas.map(reserva => (
                <div key={reserva.id} className="p-3 space-y-2 border bg-slate-900/50 rounded-xl border-slate-700/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{reserva.hospede}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">📅 {reserva.checkIn.split('-').reverse().join('/')} - {reserva.checkOut.split('-').reverse().join('/')}</p>
                    </div>
                    <span className="px-2 py-0.5 font-mono text-xs border rounded bg-slate-800 border-slate-700 text-slate-300">Q: {reserva.quarto}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 text-xs border-t border-slate-800">
                    <span className="text-slate-400">{reserva.origem} • {calcularDias(reserva.checkIn, reserva.checkOut)} dias</span>
                    <span className="font-bold text-emerald-400">R$ {Number(reserva.valor).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PC view */}
          <div className="hidden w-full overflow-x-auto border rounded-lg md:block border-slate-700/50">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-xs font-semibold uppercase border-b bg-slate-900/50 border-slate-700 text-slate-400">
                  <th className="p-3">Hóspede</th>
                  <th className="p-3">Quarto</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Dias</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-700/50">
                {reservasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">Nenhuma reserva para os filtros selecionados.</td>
                  </tr>
                ) : (
                  reservasFiltradas.map(reserva => (
                    <tr key={reserva.id} className="transition-colors hover:bg-slate-700/30">
                      <td className="p-3 font-medium text-slate-200">
                        {reserva.hospede}
                        <div className="text-[10px] text-slate-500 mt-0.5">{reserva.checkIn.split('-').reverse().join('/')} até {reserva.checkOut.split('-').reverse().join('/')}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 font-mono text-xs border rounded bg-slate-900 border-slate-700">{reserva.quarto}</span>
                      </td>
                      <td className="p-3 text-slate-400">{reserva.origem}</td>
                      <td className="p-3 text-slate-400">{calcularDias(reserva.checkIn, r.checkOut || reserva.checkOut)} dias</td>
                      <td className="p-3 font-medium text-emerald-400">R$ {Number(reserva.valor).toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          obterStatusCheckout(reserva.checkOut) === 'Sai hoje' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>{obterStatusCheckout(reserva.checkOut)}</span>
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
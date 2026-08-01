import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ==========================================
// CONFIGURAÇÕES E CONSTANTES
// ==========================================
const API_URL = 'https://organizacao-hr-stays.onrender.com/api/reservas';
const TOTAL_QUARTOS = 8;

const NOMES_DOS_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// ==========================================
// FUNÇÕES UTILITÁRIAS (FORMATADORES DE DATA E MOEDA)
// ==========================================
const formatarParaBanco = (dataString) => {
  if (!dataString) return '';
  if (dataString.includes('-')) return dataString;
  if (dataString.includes('/')) {
    const [dia, mes, ano] = dataString.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return dataString;
};

const formatarDataBR = (dataString) => {
  if (!dataString) return '';
  const dataLimpa = dataString.split('T')[0];
  const [ano, mes, dia] = dataLimpa.split('-');
  return `${dia}/${mes}/${ano}`;
};

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

const calcularDias = (inDate, outDate) => {
  if (!inDate || !outDate) return 0;
  const inicio = new Date(`${formatarParaBanco(inDate)}T00:00:00`);
  const fim = new Date(`${formatarParaBanco(outDate)}T00:00:00`);
  const diferencaTempo = fim - inicio;
  const dias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 1;
};

const obterHojeStringLocal = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const obterStatusCheckout = (outDate) => {
  if (!outDate) return 'Hoje';
  const hoje = new Date(`${obterHojeStringLocal()}T00:00:00`);
  const dataFim = new Date(`${formatarParaBanco(outDate)}T00:00:00`);
  const diferencaDias = Math.ceil((dataFim - hoje) / (1000 * 60 * 60 * 24));

  if (diferencaDias === 0) return 'Sai hoje';
  if (diferencaDias === 1) return 'Sai amanhã';
  if (diferencaDias > 1) return `Sai em ${diferencaDias} dias`;
  return 'Check-out encerrado';
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filtros de Data Avançados
  const [dataInicioFiltro, setDataInicioFiltro] = useState('');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('checkIn');

  // Controle Diário / Calendário
  const hojeStr = useMemo(() => obterHojeStringLocal(), []);
  const [dataControleDiario, setDataControleDiario] = useState(hojeStr);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  // Form State
  const [formData, setFormData] = useState({
    hospede: '',
    quarto: '',
    origem: 'Airbnb',
    valor: '',
    checkIn: '',
    checkOut: ''
  });

  const carregarReservas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Erro na comunicação com o servidor');
      const dados = await res.json();
      
      const dadosFormatados = dados.map(item => ({
        ...item,
        checkIn: item.check_in ? item.check_in.split('T')[0] : (item.checkIn || ''),
        checkOut: item.check_out ? item.check_out.split('T')[0] : (item.checkOut || '')
      }));
      setReservas(dadosFormatados);
    } catch (err) {
      console.error('Erro ao buscar reservas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarReservas();
  }, [carregarReservas]);

  // Manipulador de mudança nos inputs do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { hospede, quarto, valor, checkIn, checkOut, origem } = formData;

    if (!hospede || !quarto || !valor || !checkIn || !checkOut) {
      alert('Por favor, preencha todos os campos do formulário!');
      return;
    }

    const valorTratado = Number(String(valor).replace(',', '.'));
    if (isNaN(valorTratado) || valorTratado <= 0) {
      alert('Por favor, informe um valor válido para a reserva.');
      return;
    }

    setSubmitting(true);

    const novaReserva = {
      hospede: String(hospede).trim(),
      quarto: String(quarto).trim(),
      origem: String(origem),
      valor: valorTratado,
      checkIn: formatarParaBanco(checkIn),
      checkOut: formatarParaBanco(checkOut)
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaReserva)
      });

      if (!res.ok) {
        const textoErro = await res.json();
        throw new Error(textoErro.erro || 'Falha ao salvar reserva no backend');
      }

      await carregarReservas();
      setFormData({
        hospede: '',
        quarto: '',
        origem: 'Airbnb',
        valor: '',
        checkIn: '',
        checkOut: ''
      });
      alert('Reserva salva com sucesso! 🎉');
    } catch (err) {
      console.error('Erro ao cadastrar reserva:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // --- CÁLCULOS DERIVADOS (MEMOIZADOS PARA EVITAR RE-RENDERS) ---
  const checkInsHoje = useMemo(() => reservas.filter(r => r.checkIn === hojeStr), [reservas, hojeStr]);
  const checkOutsHoje = useMemo(() => reservas.filter(r => r.checkOut === hojeStr), [reservas, hojeStr]);

  const quartosOcupadosHoje = useMemo(() => {
    const ativas = reservas.filter(r => hojeStr >= r.checkIn && hojeStr < r.checkOut);
    return [...new Set(ativas.map(r => String(r.quarto).trim()))];
  }, [reservas, hojeStr]);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter(r => {
      const dataAlvo = tipoFiltro === 'checkIn' ? r.checkIn : r.checkOut;
      if (dataInicioFiltro && dataAlvo < dataInicioFiltro) return false;
      if (dataFimFiltro && dataAlvo > dataFimFiltro) return false;
      return true;
    });
  }, [reservas, tipoFiltro, dataInicioFiltro, dataFimFiltro]);

  const faturamentoPeriodo = useMemo(() => {
    return reservasFiltradas.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  }, [reservasFiltradas]);

  const checkInsDoDiaSelecionado = useMemo(() => 
    reservas.filter(r => r.checkIn === dataControleDiario), 
  [reservas, dataControleDiario]);

  const checkOutsDoDiaSelecionado = useMemo(() => 
    reservas.filter(r => r.checkOut === dataControleDiario), 
  [reservas, dataControleDiario]);

  const limparFiltros = () => {
    setDataInicioFiltro('');
    setDataFimFiltro('');
  };

  // --- LÓGICA DO CALENDÁRIO ---
  const diasDoMes = useMemo(() => {
    const primeiroDiaDaSemana = new Date(anoAtual, mesAtual, 1).getDay();
    const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const matriz = [];
    for (let i = 0; i < primeiroDiaDaSemana; i++) matriz.push(null);
    for (let dia = 1; dia <= totalDiasNoMes; dia++) matriz.push(dia);
    return matriz;
  }, [anoAtual, mesAtual]);

  const navegarMes = (direcao) => {
    if (direcao === 'voltar') {
      if (mesAtual === 0) { setMesAtual(11); setAnoAtual(p => p - 1); }
      else { setMesAtual(p => p - 1); }
    } else {
      if (mesAtual === 11) { setMesAtual(0); setAnoAtual(p => p + 1); }
      else { setMesAtual(p => p + 1); }
    }
  };

  const verificarSinalizacaoDia = useCallback((dia) => {
    if (!dia) return { temCheckIn: false, temCheckOut: false };
    const mFmt = String(mesAtual + 1).padStart(2, '0');
    const dFmt = String(dia).padStart(2, '0');
    const dStr = `${anoAtual}-${mFmt}-${dFmt}`;
    return {
      temCheckIn: reservas.some(r => r.checkIn === dStr),
      temCheckOut: reservas.some(r => r.checkOut === dStr)
    };
  }, [reservas, mesAtual, anoAtual]);

  return (
    <div className="min-h-screen p-3 font-sans md:p-6 bg-slate-900 text-slate-100">
      {/* HEADER */}
      <header className="flex flex-col items-center justify-between gap-3 pb-4 mb-6 text-center border-b border-slate-800 sm:flex-row sm:text-left">
        <div>
          <h1 className="text-xl font-bold text-blue-400 md:text-3xl">HR Stays • Painel de Reservas</h1>
          <p className="mt-0.5 text-xs text-slate-400">Controle diário e filtros personalizados</p>
        </div>
        <div className="text-[11px] bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-slate-300">
          📅 Hoje: {formatarDataBR(hojeStr)}
        </div>
      </header>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        <div className="p-3 border shadow-md bg-slate-800 rounded-xl border-slate-700">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">No Imóvel Hoje</p>
          <p className="mt-1 text-xl font-bold text-blue-400 md:text-2xl">
            {quartosOcupadosHoje.length} de {TOTAL_QUARTOS}
          </p>
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
          <p className="mt-1 text-xl font-bold text-emerald-400 md:text-2xl">{formatarMoeda(faturamentoPeriodo)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* FORMULÁRIO */}
        <div className="p-4 border shadow-lg md:p-6 bg-slate-800 rounded-xl h-fit border-slate-700">
          <h2 className="mb-4 text-base font-semibold md:text-xl text-slate-200">Nova Reserva</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Nome do Hóspede</label>
              <input
                type="text"
                name="hospede"
                value={formData.hospede}
                onChange={handleInputChange}
                className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ex: João Silva"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Quarto</label>
                <input
                  type="text"
                  name="quarto"
                  value={formData.quarto}
                  onChange={handleInputChange}
                  className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: 05"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Origem</label>
                <select
                  name="origem"
                  value={formData.origem}
                  onChange={handleInputChange}
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
                step="0.01"
                name="valor"
                value={formData.valor}
                onChange={handleInputChange}
                className="w-full p-3 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ex: 450.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Check-in</label>
                <input
                  type="date"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Check-out</label>
                <input
                  type="date"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full p-3 mt-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg shadow-md hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar Reserva'}
            </button>
          </form>
        </div>

        {/* LISTAGEM E CALENDÁRIO */}
        <div className="p-4 space-y-4 border shadow-lg md:p-6 lg:col-span-2 bg-slate-800 rounded-xl border-slate-700">
          
          {/* VISÃO DIÁRIA COM CALENDÁRIO NATIVO */}
          <div className="p-3 border rounded-xl bg-slate-900/40 border-slate-700/80">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navegarMes('voltar')}
                  className="p-1 px-1.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  ◀
                </button>
                <span className="text-xs font-bold font-mono text-slate-200 min-w-[90px] text-center">
                  {NOMES_DOS_MESES[mesAtual]} {anoAtual}
                </span>
                <button
                  onClick={() => navegarMes('avancar')}
                  className="p-1 px-1.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  ▶
                </button>
              </div>
              <span className="text-[10px] font-bold tracking-wide text-blue-400 uppercase font-mono">
                📍 {formatarDataBR(dataControleDiario)}
              </span>
            </div>

            {/* Grid do mini calendário */}
            <div className="mb-4">
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-500 uppercase mb-1">
                <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasDoMes.map((dia, index) => {
                  if (dia === null) return <div key={`vazio-${index}`} className="h-7"></div>;

                  const mFmt = String(mesAtual + 1).padStart(2, '0');
                  const dFmt = String(dia).padStart(2, '0');
                  const itemDataStr = `${anoAtual}-${mFmt}-${dFmt}`;
                  const isSelecionado = dataControleDiario === itemDataStr;
                  const { temCheckIn, temCheckOut } = verificarSinalizacaoDia(dia);

                  return (
                    <button
                      key={`dia-${dia}`}
                      type="button"
                      onClick={() => setDataControleDiario(itemDataStr)}
                      className={`h-7 text-xs font-semibold rounded relative flex flex-col items-center justify-center transition-all ${
                        isSelecionado 
                          ? 'bg-blue-600 text-white shadow' 
                          : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-slate-800/60'
                      }`}
                    >
                      <span className={isSelecionado ? 'mt-0' : 'mt-0.5'}>{dia}</span>
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {temCheckIn && <span className="w-1 h-1 rounded-full bg-emerald-400"></span>}
                        {temCheckOut && <span className="w-1 h-1 rounded-full bg-amber-400"></span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Entradas */}
              <div className="p-2 border rounded-lg bg-slate-900/50 border-emerald-500/10">
                <p className="text-[11px] font-bold text-emerald-400 uppercase mb-1">
                  📥 Entrando no dia ({checkInsDoDiaSelecionado.length})
                </p>
                {checkInsDoDiaSelecionado.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nenhum check-in.</p>
                ) : (
                  <div className="space-y-1">
                    {checkInsDoDiaSelecionado.map(r => (
                      <div key={r.id || `${r.hospede}-${r.checkIn}`} className="flex justify-between p-1 text-xs rounded text-slate-300 bg-slate-800/50">
                        <span>{r.hospede}</span>
                        <span className="font-mono text-[11px] bg-slate-900 px-1 rounded text-slate-400">Quarto {r.quarto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saídas */}
              <div className="p-2 border rounded-lg bg-slate-900/50 border-amber-500/10">
                <p className="text-[11px] font-bold text-amber-400 uppercase mb-1">
                  📤 Saindo no dia ({checkOutsDoDiaSelecionado.length})
                </p>
                {checkOutsDoDiaSelecionado.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nenhum check-out.</p>
                ) : (
                  <div className="space-y-1">
                    {checkOutsDoDiaSelecionado.map(r => (
                      <div key={r.id || `${r.hospede}-${r.checkOut}`} className="flex justify-between p-1 text-xs rounded text-slate-300 bg-slate-800/50">
                        <span>{r.hospede}</span>
                        <span className="font-mono text-[11px] bg-slate-900 px-1 rounded text-slate-400">Quarto {r.quarto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FILTROS AVANÇADOS */}
          <div className="p-3 space-y-3 border rounded-xl bg-slate-900/60 border-slate-700/60">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-300">Filtros de Período</span>
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

          {/* TABELA / CARDS DE RESERVAS */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">Carregando dados das reservas...</div>
          ) : (
            <>
              {/* VISÃO MOBILE */}
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
                            📅 {formatarDataBR(reserva.checkIn)} até {formatarDataBR(reserva.checkOut)}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 font-mono text-xs border rounded bg-slate-800 border-slate-700 text-slate-300">
                          Q: {reserva.quarto}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-800">
                        <span className="text-slate-400">{reserva.origem} • {calcularDias(reserva.checkIn, reserva.checkOut)} dias</span>
                        <span className="font-bold text-emerald-400">{formatarMoeda(reserva.valor)}</span>
                      </div>

                      <div className="pt-1 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          obterStatusCheckout(reserva.checkOut) === 'Sai hoje' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          obterStatusCheckout(reserva.checkOut) === 'Sai amanhã' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          obterStatusCheckout(reserva.checkOut) === 'Check-out encerrado' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {obterStatusCheckout(reserva.checkOut)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VISÃO DESKTOP */}
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
                              {formatarDataBR(reserva.checkIn)} até {formatarDataBR(reserva.checkOut)}
                            </div>
                          </td>
                          <td className="p-3 text-slate-300">
                            <span className="px-2 py-1 font-mono text-xs border rounded bg-slate-900 border-slate-700">{reserva.quarto}</span>
                          </td>
                          <td className="p-3 text-slate-400">{reserva.origem}</td>
                          <td className="p-3 text-slate-400">{calcularDias(reserva.checkIn, reserva.checkOut)} dias</td>
                          <td className="p-3 font-medium text-emerald-400">{formatarMoeda(reserva.valor)}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              obterStatusCheckout(reserva.checkOut) === 'Sai hoje' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              obterStatusCheckout(reserva.checkOut) === 'Sai amanhã' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                              obterStatusCheckout(reserva.checkOut) === 'Check-out encerrado' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
            </>
          )}

        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

export default function App() {
  const [reservas, setReservas] = useState([]);
  
  // Controle da Visão Diária (Aba de cliques por dia)
  const [dataSelecaoDiaria, setDataSelecaoDiaria] = useState('');

  // Filtros do Fechamento Mensal (Ajuste de Valor)
  const [dataInicioFiltro, setDataInicioFiltro] = useState('');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  
  // Estados do Formulário
  const [hospede, setHospede] = useState('');
  const [origem, setOrigem] = useState('Airbnb');
  const [quarto, setQuarto] = useState('');
  const [valor, setValor] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Garante formato YYYY-MM-DD
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

  // Inicializa a data do clique diário com o dia de hoje
  useEffect(() => {
    setDataSelecaoDiaria(obterHojeStringLocal());
  }, []);

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

      if (!respuesta.ok) return alert('Erro ao salvar no servidor.');

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

  // --- LÓGICA 1: ABA DE ACOMPANHAMENTO DIÁRIO (QUEM ENTRA / SAI NO DIA SELECIONADO) ---
  const checkInsDoDia = reservas.filter(r => r.checkIn === dataSelecaoDiaria);
  const checkOutsDoDia = reservas.filter(r => r.checkOut === dataSelecaoDiaria);

  // --- LÓGICA 2: FILTRO DO FECHAMENTO MENSAL (CÁLCULO E AJUSTE DE VALOR) ---
  const reservasFiltradasMensal = reservas.filter(r => {
    if (dataInicioFiltro && r.checkIn < dataInicioFiltro) return false;
    if (dataFimFiltro && r.checkIn > dataFimFiltro) return false;
    return true;
  });

  const faturamentoMensalSoma = reservasFiltradasMensal.reduce((acc, curr) => acc + Number(curr.valor), 0);

  return (
    <div className="min-h-screen p-3 font-sans md:p-6 bg-slate-900 text-slate-100">
      <header className="pb-4 mb-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-blue-400 md:text-3xl">HR Stays • Painel de Gestão</h1>
          <p className="mt-0.5 text-xs text-slate-400">Acompanhamento diário preciso e fechamento de caixa</p>
        </div>
      </header>

      {/* SEÇÃO PRINCIPAL EM GRIDS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* COLUNA 1: FORMULÁRIO DE ENTRADA */}
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
              <label className="block mb-1 text-xs font-medium uppercase text-slate-400">Valor Total</label>
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

            <button type="submit" className="w-full p-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
              Salvar Reserva
            </button>
          </form>
        </div>

        {/* COLUNA 2 E 3: ABAS DE CONTROLE (DIÁRIO VS FECHAMENTO MENSAL) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 🗓️ ABA 1: VISÃO E COMPROVAÇÃO DIÁRIA */}
          <div className="p-4 border shadow-md bg-slate-800 rounded-xl border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-700 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-blue-400 uppercase tracking-wide">🔍 Aba de Controle Diário</h2>
                <p className="text-xs text-slate-400 mt-0.5">Selecione qualquer dia para ver quem se movimenta no imóvel</p>
              </div>
              <input 
                type="date" 
                value={dataSelecaoDiaria} 
                onChange={e => setDataSelecaoDiaria(e.target.value)} 
                className="p-2 text-sm text-white border rounded-lg bg-slate-900 border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Sub-Aba de Fluxo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Entradas do Dia */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-emerald-500/20">
                <h3 className="text-xs font-bold text-emerald-400 uppercase border-b border-slate-800 pb-1.5 mb-2 flex justify-between">
                  <span>📥 Entradas (Check-in)</span>
                  <span className="bg-emerald-500/10 px-1.5 rounded text-[11px]">{checkInsDoDia.length}</span>
                </h3>
                {checkInsDoDia.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2 italic">Nenhum check-in programado.</p>
                ) : (
                  <div className="space-y-2">
                    {checkInsDoDia.map(r => (
                      <div key={r.id} className="p-2 bg-slate-800/80 rounded-lg text-xs flex justify-between items-center border border-slate-700">
                        <div>
                          <p className="font-semibold text-slate-200">{r.hospede}</p>
                          <p className="text-[10px] text-slate-400">{r.origem} • {calcularDias(r.checkIn, r.checkOut)} diárias</p>
                        </div>
                        <span className="font-mono px-2 py-0.5 bg-slate-900 border border-slate-700 text-blue-400 rounded">Q: {r.quarto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saídas do Dia */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-amber-500/20">
                <h3 className="text-xs font-bold text-amber-400 uppercase border-b border-slate-800 pb-1.5 mb-2 flex justify-between">
                  <span>📤 Saídas (Check-out)</span>
                  <span className="bg-amber-500/10 px-1.5 rounded text-[11px]">{checkOutsDoDia.length}</span>
                </h3>
                {checkOutsDoDia.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2 italic">Nenhum check-out programado.</p>
                ) : (
                  <div className="space-y-2">
                    {checkOutsDoDia.map(r => (
                      <div key={r.id} className="p-2 bg-slate-800/80 rounded-lg text-xs flex justify-between items-center border border-slate-700">
                        <div>
                          <p className="font-semibold text-slate-200">{r.hospede}</p>
                          <p className="text-[10px] text-slate-400">{r.origem} • Total: R$ {Number(r.valor).toFixed(2)}</p>
                        </div>
                        <span className="font-mono px-2 py-0.5 bg-slate-900 border border-slate-700 text-blue-400 rounded">Q: {r.quarto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 📈 ABA 2: FECHAMENTO MENSAL E HISTÓRICO GERAL */}
          <div className="p-4 border shadow-md bg-slate-800 rounded-xl border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-700 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-emerald-400 uppercase tracking-wide">📊 Fechamento Mensal e Caixa</h2>
                <p className="text-xs text-slate-400 mt-0.5">Defina o período para ajustar e somar o faturamento</p>
              </div>
              <div className="flex gap-2 items-center">
                <input type="date" value={dataInicioFiltro} onChange={e => setDataInicioFiltro(e.target.value)} className="p-1.5 text-xs text-white border rounded-lg bg-slate-900 border-slate-700" />
                <span className="text-xs text-slate-500">até</span>
                <input type="date" value={dataFimFiltro} onChange={e => setDataFimFiltro(e.target.value)} className="p-1.5 text-xs text-white border rounded-lg bg-slate-900 border-slate-700" />
              </div>
            </div>

            {/* Card de Faturamento Gerado pelo Filtro Acima */}
            <div className="p-3 mb-4 bg-slate-900/40 rounded-xl border border-slate-700/60 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400 uppercase">Faturamento Ajustado no Período:</span>
              <span className="text-xl font-bold text-emerald-400">R$ {faturamentoMensalSoma.toFixed(2)}</span>
            </div>

            {/* Listagem Geral de Histórico Responsiva */}
            <div className="w-full overflow-x-auto border rounded-lg border-slate-700/50 hidden md:block">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="text-xs font-semibold uppercase border-b bg-slate-900/50 border-slate-700 text-slate-400">
                    <th className="p-2.5">Hóspede</th>
                    <th className="p-2.5">Quarto</th>
                    <th className="p-2.5">Origem</th>
                    <th className="p-2.5">Período</th>
                    <th className="p-2.5">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-700/50">
                  {reservasFiltradasMensal.map(reserva => (
                    <tr key={reserva.id} className="hover:bg-slate-700/20">
                      <td className="p-2.5 font-medium text-slate-200">{reserva.hospede}</td>
                      <td className="p-2.5"><span className="px-1.5 py-0.5 font-mono bg-slate-900 border border-slate-700 rounded">{reserva.quarto}</span></td>
                      <td className="p-2.5 text-slate-400">{reserva.origem}</td>
                      <td className="p-2.5 text-slate-400">{reserva.checkIn.split('-').reverse().join('/')} - {reserva.checkOut.split('-').reverse().join('/')}</td>
                      <td className="p-2.5 font-medium text-emerald-400">R$ {Number(reserva.valor).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Listagem Celular para o Fechamento */}
            <div className="block md:hidden space-y-2">
              {reservasFiltradasMensal.map(reserva => (
                <div key={reserva.id} className="p-2.5 bg-slate-900/30 rounded-lg border border-slate-700/50 flex justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{reserva.hospede} (Q: {reserva.quarto})</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{reserva.checkIn.split('-').reverse().join('/')} até {reserva.checkOut.split('-').reverse().join('/')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">R$ {Number(reserva.valor).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">{reserva.origem}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
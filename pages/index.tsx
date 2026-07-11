"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PESSOAS = ["Alba", "Evandro", "João"];
const MESES = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const AVATAR_COLORS: Record<string, [string, string]> = {
  Alba: ["#ede9fe", "#7c3aed"],
  Evandro: ["#dbeafe", "#1d4ed8"],
  João: ["#dcfce7", "#15803d"],
};

type Gasto = {
  id: number;
  tipo: string;
  pessoa: string;
  categoria: string;
  descricao: string;
  valor: number;
  created_at?: string;
};

type Tab = "painel" | "entradas" | "saidas";

function fmt(v: number) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function Home() {
  const [mensagemSucesso, setMensagemSucesso] = useState(false);
  const [gastoParaExcluir, setGastoParaExcluir] = useState<number | null>(null);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [tab, setTab] = useState<Tab>("painel");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState("");

  const [formEntrada, setFormEntrada] = useState({ pessoa: "", descricao: "", valor: "" });
  const [formSaida, setFormSaida] = useState({ pessoa: "", categoria: "", descricao: "", valor: "" });

  useEffect(() => {
    carregarGastos();
    const channel = supabase
      .channel("gastos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "gastos" }, () => carregarGastos())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function carregarGastos() {
    const { data, error } = await supabase
      .from("gastos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return console.error(error);
    setGastos(data || []);
  }

  async function adicionarEntrada() {
    if (!formEntrada.pessoa || !formEntrada.descricao || !formEntrada.valor) {
      alert("Preencha todos os campos");
      return;
    }
    const { data, error } = await supabase
      .from("gastos")
      .insert([{ tipo: "Entrada", pessoa: formEntrada.pessoa, categoria: "Entrada", descricao: formEntrada.descricao, valor: Number(formEntrada.valor) }])
      .select();
    if (error) { console.error(error); alert("Erro ao salvar"); return; }
    setGastos((prev) => [data[0], ...prev]);
    mostrarSucesso();
    setFormEntrada({ pessoa: "", descricao: "", valor: "" });
  }

  async function adicionarSaida() {
    if (!formSaida.pessoa || !formSaida.categoria || !formSaida.descricao || !formSaida.valor) {
      alert("Preencha todos os campos");
      return;
    }
    const { data, error } = await supabase
      .from("gastos")
      .insert([{ tipo: "Saída", pessoa: formSaida.pessoa, categoria: formSaida.categoria, descricao: formSaida.descricao, valor: Number(formSaida.valor) }])
      .select();
    if (error) { console.error(error); alert("Erro ao salvar"); return; }
    setGastos((prev) => [data[0], ...prev]);
    mostrarSucesso();
    setFormSaida({ pessoa: "", categoria: "", descricao: "", valor: "" });
  }

  function mostrarSucesso() {
    setMensagemSucesso(true);
    setTimeout(() => setMensagemSucesso(false), 3000);
  }

  async function remover(id: number) {
    const { error } = await supabase.from("gastos").delete().eq("id", id);
    if (error) { console.error(error); alert("Erro ao excluir"); return; }
    await carregarGastos();
  }

  const entradas = gastos.filter((g) => g.tipo === "Entrada");
  const saidas   = gastos.filter((g) => g.tipo === "Saída");
  const totalEntradas = entradas.reduce((a, g) => a + Number(g.valor), 0);
  const totalSaidas   = saidas.reduce((a, g) => a + Number(g.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  const resumoPorPessoa = PESSOAS.map((pessoa) => {
    const pg  = gastos.filter((g) => g.pessoa === pessoa);
    const ent = pg.filter((g) => g.tipo === "Entrada").reduce((a, g) => a + Number(g.valor), 0);
    const sai = pg.filter((g) => g.tipo === "Saída").reduce((a, g) => a + Number(g.valor), 0);
    return { pessoa, entradas: ent, saidas: sai, saldo: ent - sai };
  });

  const listaPainel = mesSelecionado
    ? gastos.filter((g) => String(new Date(g.created_at!).getMonth() + 1).padStart(2, "0") === mesSelecionado)
    : gastos;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f3ff; }

        .app-root { min-height: 100vh; background: #f5f3ff; color: #1e1b4b; font-family: 'Inter', sans-serif; }

        /* ── NAVBAR ── */
        .navbar {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.25rem; height: 58px;
          background: #fff; border-bottom: 1px solid #e8e4f8;
          box-shadow: 0 1px 8px rgba(124,58,237,0.07);
        }
        .nav-brand { font-size: 1.05rem; font-weight: 700; color: #1e1b4b; letter-spacing: -0.3px; white-space: nowrap; }
        .nav-brand span { color: #7c3aed; }
        .nav-tabs { display: flex; gap: 0.2rem; }
        .nav-tab {
          padding: 0.45rem 0.9rem; border: none; background: transparent;
          color: #94a3b8; font-size: 0.85rem; font-weight: 500;
          border-radius: 8px; cursor: pointer; transition: all 0.18s; font-family: inherit;
        }
        .nav-tab:hover  { color: #1e1b4b; background: #f5f3ff; }
        .nav-tab.active { color: #7c3aed; background: #ede9fe; font-weight: 600; }
        .hamburger { display: none; background: none; border: none; color: #64748b; font-size: 1.4rem; cursor: pointer; padding: 0.25rem; }
        @media (max-width: 640px) {
          .nav-tabs { display: none; }
          .nav-tabs.open {
            display: flex; flex-direction: column;
            position: absolute; top: 58px; left: 0; right: 0;
            background: #fff; border-bottom: 1px solid #e8e4f8;
            padding: 0.5rem; box-shadow: 0 6px 16px rgba(124,58,237,0.1); z-index: 49;
          }
          .hamburger { display: block; }
        }

        /* ── LAYOUT ── */
        .container { max-width: 860px; margin: 0 auto; padding: 1.75rem 1rem; }
        @media (max-width: 480px) { .container { padding: 1.25rem 0.75rem; } }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #1e1b4b; margin-bottom: 0.2rem; letter-spacing: -0.4px; }
        .page-sub   { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.5rem; }

        .success-msg {
          padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1.1rem;
          background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-size: 0.85rem;
        }

        /* ── PANELS ── */
        .panel {
          background: #fff; border: 1px solid #e8e4f8;
          border-radius: 16px; box-shadow: 0 2px 12px rgba(124,58,237,0.06);
          padding: 1.25rem; margin-bottom: 1rem;
        }
        @media (max-width: 480px) { .panel { padding: 1rem; border-radius: 14px; } }
        .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.1rem; }
        .panel-title  { font-size: 0.95rem; font-weight: 600; color: #1e1b4b; }
        .panel-total  { font-size: 0.95rem; font-weight: 700; white-space: nowrap; }

        /* ── METRICS ── */
        .metrics { display: grid; gap: 0.85rem; margin-bottom: 1rem; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 560px) { .metrics { grid-template-columns: 1fr; gap: 0.65rem; } }
        .metric-card {
          background: #fff; border: 1px solid #e8e4f8; border-radius: 16px;
          box-shadow: 0 2px 12px rgba(124,58,237,0.06); padding: 1.1rem 1.25rem;
          position: relative; overflow: hidden;
        }
        .metric-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
        .metric-label  { font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.6px; }
        .metric-value  { font-size: 1.45rem; font-weight: 700; letter-spacing: -0.4px; }
        @media (max-width: 480px) { .metric-value { font-size: 1.25rem; } }

        /* ── PERSON CARDS ── */
        .person-grid { display: grid; gap: 0.85rem; margin-bottom: 1rem; grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 560px) { .person-grid { grid-template-columns: 1fr; gap: 0.65rem; } }
        .person-card {
          background: #fff; border: 1px solid #e8e4f8; border-radius: 16px;
          box-shadow: 0 2px 12px rgba(124,58,237,0.06); padding: 1.1rem;
        }
        .person-head  { display: flex; align-items: center; gap: 0.65rem; padding-bottom: 0.8rem; margin-bottom: 0.8rem; border-bottom: 1px solid #f3f0ff; }
        .person-name  { font-size: 0.9rem; font-weight: 600; color: #1e1b4b; }
        .person-row   { display: flex; justify-content: space-between; padding: 0.25rem 0; }
        .person-row-label { font-size: 0.78rem; color: #94a3b8; }
        .person-row-val   { font-size: 0.82rem; font-weight: 600; }
        .person-saldo {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 0.5rem; margin-top: 0.35rem; border-top: 1.5px dashed #ede9fe;
        }
        .person-saldo-label { font-size: 0.78rem; font-weight: 700; color: #64748b; }

        /* ── SECTION LABEL ── */
        .section-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.65rem; }

        /* ── FORM INLINE (shared) ── */
        .inline-form { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
        .if-pessoa   { flex: 0 1 148px; min-width: 120px; }
        .if-cat      { flex: 0 1 152px; min-width: 130px; }
        .if-desc     { flex: 1 1 160px; min-width: 130px; }
        .if-valor    { flex: 0 1 120px; min-width: 100px; }
        .if-btn      { flex: 0 0 auto; }
        @media (max-width: 560px) {
          .inline-form { flex-direction: column; gap: 0.65rem; }
          .if-pessoa, .if-cat, .if-desc, .if-valor, .if-btn { flex: 1 1 auto; width: 100%; }
        }

        .field-label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.35rem; font-weight: 500; }
        .field-input, .field-select {
          width: 100%; padding: 0.65rem 0.8rem; border-radius: 10px;
          border: 1.5px solid #e8e4f8; background: #faf9ff;
          color: #1e1b4b; font-size: 0.875rem; outline: none;
          font-family: inherit; transition: border-color 0.18s;
          -webkit-appearance: none; appearance: none;
        }
        .field-input::placeholder { color: #c4b5fd; }
        .field-input:focus, .field-select:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
        /* dropdown arrow */
        .field-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a78bfa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; padding-right: 2rem; }

        /* ── BUTTONS ── */
        .btn-green {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.65rem 1.1rem; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; box-shadow: 0 3px 10px rgba(34,197,94,0.22);
          white-space: nowrap; font-family: inherit;
          min-height: 44px;
        }
        .btn-green:active { transform: scale(0.97); }

        .btn-purple {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.65rem 1.1rem; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: #fff; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; box-shadow: 0 3px 10px rgba(124,58,237,0.22);
          white-space: nowrap; font-family: inherit;
          min-height: 44px;
        }
        .btn-purple:active { transform: scale(0.97); }

        .btn-ghost {
          padding: 0.6rem 1rem; border-radius: 10px;
          background: transparent; border: 1.5px solid #e8e4f8;
          color: #64748b; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: all 0.18s; font-family: inherit;
          min-height: 44px;
        }
        .btn-ghost:hover { border-color: #7c3aed; color: #7c3aed; background: #faf5ff; }

        /* ── ENTRY LIST ── */
        .entry-list { display: flex; flex-direction: column; }

        .entry-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.85rem 0; border-bottom: 1px solid #f3f0ff;
        }
        .entry-item:first-child { padding-top: 0.1rem; }
        .entry-item:last-child  { border-bottom: none; }

        /* avatar */
        .avatar {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem; font-weight: 700; flex-shrink: 0;
        }
        @media (max-width: 400px) { .avatar { width: 32px; height: 32px; font-size: 0.68rem; } }

        /* body: two rows */
        .entry-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.18rem; }
        .entry-head { display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; }
        .entry-nome { font-size: 0.68rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
        .entry-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .entry-desc { font-size: 0.9rem; color: #1e1b4b; font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .entry-valor { font-size: 0.975rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; }

        .entry-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 0.85rem; margin-top: 0.3rem; border-top: 1.5px solid #ede9fe;
        }
        .entry-footer-label { font-size: 0.8rem; color: #94a3b8; }
        .entry-footer-total { font-size: 1.05rem; font-weight: 700; }

        /* delete */
        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: #d1d5db; font-size: 1rem; padding: 0.4rem 0.45rem;
          border-radius: 8px; flex-shrink: 0; transition: all 0.15s;
          min-width: 36px; min-height: 36px; display: flex; align-items: center; justify-content: center;
        }
        .icon-btn:hover { color: #dc2626; background: #fef2f2; }

        /* ── TAGS ── */
        .tag { display: inline-block; padding: 0.18rem 0.55rem; border-radius: 999px; font-size: 0.68rem; font-weight: 600; white-space: nowrap; }
        .tag-entrada { background: #dcfce7; color: #15803d; }
        .tag-saida   { background: #fee2e2; color: #b91c1c; }
        .tag-cat     { background: #f5f3ff; color: #7c3aed; border: 1px solid #ede9fe; }

        /* ── TABLE (painel) ── */
        .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; min-width: 480px; }
        thead th {
          text-align: left; font-size: 0.68rem; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.5px;
          padding: 0 0.7rem 0.6rem; border-bottom: 1.5px solid #ede9fe;
        }
        tbody td { padding: 0.75rem 0.7rem; font-size: 0.85rem; border-bottom: 1px solid #f5f3ff; color: #374151; }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: #faf9ff; }
        .pessoa-cell { display: flex; align-items: center; gap: 0.45rem; }
        .avatar-sm {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.63rem; font-weight: 700; flex-shrink: 0;
        }

        .empty { text-align: center; padding: 2.5rem 1rem; color: #c4b5fd; font-size: 0.875rem; line-height: 1.6; }

        /* ── MODAL ── */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(109,40,217,0.12);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 1rem;
        }
        .modal {
          background: #fff; border: 1px solid #e8e4f8; border-radius: 16px;
          padding: 1.5rem; width: 100%; max-width: 360px;
          box-shadow: 0 20px 50px rgba(124,58,237,0.15);
        }
        .modal h3 { font-size: 1rem; color: #1e1b4b; margin-bottom: 0.45rem; font-weight: 600; }
        .modal p  { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.1rem; line-height: 1.5; }
        .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
        .btn-danger {
          padding: 0.6rem 1rem; border-radius: 9px; border: none;
          background: #dc2626; color: #fff; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; font-family: inherit; min-height: 40px;
        }
        .btn-danger:hover { background: #b91c1c; }

        /* ── BOTTOM NAV ── */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          height: 64px;
          background: #fff; border-top: 1px solid #e8e4f8;
          display: none; justify-content: space-around; align-items: center;
          z-index: 999; box-shadow: 0 -4px 18px rgba(124,58,237,0.08);
          padding-bottom: env(safe-area-inset-bottom);
        }
        .bottom-btn {
          background: none; border: none; color: #94a3b8;
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; font-size: 11px; cursor: pointer; font-family: inherit;
          font-weight: 500; min-width: 56px; padding: 0.35rem 0;
        }
        .bottom-btn.active { color: #7c3aed; }
        .bottom-btn span { line-height: 1; }
        .bottom-add {
          width: 52px; height: 52px; border-radius: 50%; border: none;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white; font-size: 26px; line-height: 1;
          margin-top: -18px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(124,58,237,0.4);
          display: flex; align-items: center; justify-content: center;
        }

        @media (max-width: 768px) {
          .bottom-nav { display: flex; }
          .container  { padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
          .hamburger  { display: none !important; }
        }
      `}</style>

      <div className="app-root">

        {/* ── NAVBAR ── */}
        <nav className="navbar">
          <div className="nav-brand">Organização<span>Financeira</span></div>
          <div className={`nav-tabs ${menuOpen ? "open" : ""}`}>
            {(["painel", "entradas", "saidas"] as Tab[]).map((t) => (
              <button key={t} className={`nav-tab ${tab === t ? "active" : ""}`}
                onClick={() => { setTab(t); setMenuOpen(false); }}>
                {t === "painel" ? "Painel geral" : t === "entradas" ? "Entradas" : "Saídas"}
              </button>
            ))}
          </div>
          <button className="hamburger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">☰</button>
        </nav>

        <main className="container">
          {mensagemSucesso && <div className="success-msg">✅ Lançamento adicionado com sucesso!</div>}

          {/* ═══ PAINEL GERAL ═══ */}
          {tab === "painel" && (
            <>
              <h1 className="page-title">Painel geral</h1>
              <p className="page-sub">Visão completa dos lançamentos da família</p>

              <div className="metrics">
                <div className="metric-card">
                  <div className="metric-accent" style={{ background: "linear-gradient(90deg,#22c55e,#16a34a)" }} />
                  <div className="metric-label">Entradas</div>
                  <div className="metric-value" style={{ color: "#16a34a" }}>{fmt(totalEntradas)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-accent" style={{ background: "linear-gradient(90deg,#ef4444,#dc2626)" }} />
                  <div className="metric-label">Saídas</div>
                  <div className="metric-value" style={{ color: "#dc2626" }}>{fmt(totalSaidas)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-accent" style={{ background: saldo >= 0 ? "linear-gradient(90deg,#7c3aed,#6d28d9)" : "linear-gradient(90deg,#ef4444,#dc2626)" }} />
                  <div className="metric-label">Saldo</div>
                  <div className="metric-value" style={{ color: saldo >= 0 ? "#7c3aed" : "#dc2626" }}>{fmt(saldo)}</div>
                </div>
              </div>

              <p className="section-label">Resumo por pessoa</p>
              <div className="person-grid">
                {resumoPorPessoa.map(({ pessoa, entradas: ent, saidas: sai, saldo: sal }) => {
                  const av = AVATAR_COLORS[pessoa] ?? ["#f5f3ff", "#7c3aed"];
                  return (
                    <div key={pessoa} className="person-card">
                      <div className="person-head">
                        <div className="avatar" style={{ background: av[0], color: av[1] }}>{initials(pessoa)}</div>
                        <span className="person-name">{pessoa}</span>
                      </div>
                      <div className="person-row">
                        <span className="person-row-label">Entradas</span>
                        <span className="person-row-val" style={{ color: "#16a34a" }}>{fmt(ent)}</span>
                      </div>
                      <div className="person-row">
                        <span className="person-row-label">Saídas</span>
                        <span className="person-row-val" style={{ color: "#dc2626" }}>{fmt(sai)}</span>
                      </div>
                      <div className="person-saldo">
                        <span className="person-saldo-label">Saldo</span>
                        <span style={{ fontSize: "0.92rem", fontWeight: 700, color: sal >= 0 ? "#7c3aed" : "#dc2626" }}>{fmt(sal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">
                    Todos os lançamentos
                    {listaPainel.length > 0 && (
                      <span style={{ marginLeft: "0.4rem", fontSize: "0.72rem", color: "#94a3b8", fontWeight: 400 }}>
                        {listaPainel.length} {listaPainel.length === 1 ? "item" : "itens"}
                      </span>
                    )}
                  </div>
                  <select className="field-select" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} style={{ width: "145px", fontSize: "0.82rem" }}>
                    <option value="">Todos os meses</option>
                    {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                {listaPainel.length === 0 ? (
                  <div className="empty">Nenhum lançamento cadastrado ainda.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Tipo</th><th>Pessoa</th><th>Categoria</th><th>Descrição</th>
                          <th style={{ textAlign: "right" }}>Valor</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {listaPainel.map((g) => {
                          const av = AVATAR_COLORS[g.pessoa] ?? ["#f5f3ff", "#7c3aed"];
                          return (
                            <tr key={g.id}>
                              <td><span className={`tag ${g.tipo === "Entrada" ? "tag-entrada" : "tag-saida"}`}>{g.tipo}</span></td>
                              <td>
                                <div className="pessoa-cell">
                                  <div className="avatar-sm" style={{ background: av[0], color: av[1] }}>{initials(g.pessoa)}</div>
                                  {g.pessoa}
                                </div>
                              </td>
                              <td><span className="tag tag-cat">{g.categoria}</span></td>
                              <td>{g.descricao}</td>
                              <td style={{ textAlign: "right", fontWeight: 600, color: g.tipo === "Entrada" ? "#16a34a" : "#dc2626" }}>{fmt(Number(g.valor))}</td>
                              <td style={{ textAlign: "right" }}>
                                <button className="icon-btn" onClick={() => { setGastoParaExcluir(g.id); setModalExcluir(true); }} aria-label="Remover">🗑</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ ENTRADAS ═══ */}
          {tab === "entradas" && (
            <>
              <h1 className="page-title">Entradas</h1>
              <p className="page-sub">Registre os recebimentos de cada pessoa</p>

              <div className="panel">
                <div className="panel-title" style={{ marginBottom: "1rem" }}>Nova entrada</div>
                <div className="inline-form">
                  <div className="if-pessoa">
                    <label className="field-label">Pessoa</label>
                    <select className="field-select" value={formEntrada.pessoa} onChange={(e) => setFormEntrada({ ...formEntrada, pessoa: e.target.value })}>
                      <option value="">Selecione</option>
                      {PESSOAS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="if-desc">
                    <label className="field-label">Descrição</label>
                    <input className="field-input" placeholder="ex: Salário, Freelance…" value={formEntrada.descricao}
                      onChange={(e) => setFormEntrada({ ...formEntrada, descricao: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && adicionarEntrada()} />
                  </div>
                  <div className="if-valor">
                    <label className="field-label">Valor (R$)</label>
                    <input className="field-input" type="number" placeholder="0,00" value={formEntrada.valor}
                      onChange={(e) => setFormEntrada({ ...formEntrada, valor: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && adicionarEntrada()} />
                  </div>
                  <div className="if-btn">
                    <button className="btn-green" onClick={adicionarEntrada}>+ Adicionar</button>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">
                    Lançamentos
                    {entradas.length > 0 && <span style={{ marginLeft: "0.4rem", fontSize: "0.72rem", color: "#94a3b8", fontWeight: 400 }}>{entradas.length} {entradas.length === 1 ? "item" : "itens"}</span>}
                  </div>
                  {entradas.length > 0 && <span className="panel-total" style={{ color: "#16a34a" }}>{fmt(totalEntradas)}</span>}
                </div>

                {entradas.length === 0 ? (
                  <div className="empty">Nenhuma entrada registrada ainda.<br /><span style={{ fontSize: "0.78rem" }}>Use o formulário acima para adicionar.</span></div>
                ) : (
                  <div className="entry-list">
                    {entradas.map((g) => {
                      const av = AVATAR_COLORS[g.pessoa] ?? ["#f5f3ff", "#7c3aed"];
                      return (
                        <div key={g.id} className="entry-item">
                          <div className="avatar" style={{ background: av[0], color: av[1] }}>{initials(g.pessoa)}</div>
                          <div className="entry-body">
                            <div className="entry-head">
                              <span className="entry-nome">{g.pessoa}</span>
                              <span className="tag tag-entrada">Entrada</span>
                            </div>
                            <div className="entry-foot">
                              <span className="entry-desc">{g.descricao}</span>
                              <span className="entry-valor" style={{ color: "#16a34a" }}>{fmt(Number(g.valor))}</span>
                            </div>
                          </div>
                          <button className="icon-btn" onClick={() => { setGastoParaExcluir(g.id); setModalExcluir(true); }} aria-label="Remover">🗑</button>
                        </div>
                      );
                    })}
                    <div className="entry-footer">
                      <span className="entry-footer-label">Total de entradas</span>
                      <span className="entry-footer-total" style={{ color: "#16a34a" }}>{fmt(totalEntradas)}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ SAÍDAS ═══ */}
          {tab === "saidas" && (
            <>
              <h1 className="page-title">Saídas</h1>
              <p className="page-sub">Registre os gastos de cada pessoa</p>

              <div className="panel">
                <div className="panel-title" style={{ marginBottom: "1rem" }}>Nova saída</div>
                <div className="inline-form">
                  <div className="if-pessoa">
                    <label className="field-label">Pessoa</label>
                    <select className="field-select" value={formSaida.pessoa} onChange={(e) => setFormSaida({ ...formSaida, pessoa: e.target.value })}>
                      <option value="">Selecione</option>
                      {PESSOAS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="if-cat">
                    <label className="field-label">Categoria</label>
                    <select className="field-select" value={formSaida.categoria} onChange={(e) => setFormSaida({ ...formSaida, categoria: e.target.value })}>
                      <option value="">Selecione</option>
                      <option value="Conta Fixa">Conta Fixa</option>
                      <option value="Gasto Variável">Gasto Variável</option>
                    </select>
                  </div>
                  <div className="if-desc">
                    <label className="field-label">Descrição</label>
                    <input className="field-input" placeholder="ex: Mercado, Luz…" value={formSaida.descricao}
                      onChange={(e) => setFormSaida({ ...formSaida, descricao: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && adicionarSaida()} />
                  </div>
                  <div className="if-valor">
                    <label className="field-label">Valor (R$)</label>
                    <input className="field-input" type="number" placeholder="0,00" value={formSaida.valor}
                      onChange={(e) => setFormSaida({ ...formSaida, valor: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && adicionarSaida()} />
                  </div>
                  <div className="if-btn">
                    <button className="btn-purple" onClick={adicionarSaida}>+ Adicionar</button>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">
                    Lançamentos
                    {saidas.length > 0 && <span style={{ marginLeft: "0.4rem", fontSize: "0.72rem", color: "#94a3b8", fontWeight: 400 }}>{saidas.length} {saidas.length === 1 ? "item" : "itens"}</span>}
                  </div>
                  {saidas.length > 0 && <span className="panel-total" style={{ color: "#dc2626" }}>{fmt(totalSaidas)}</span>}
                </div>

                {saidas.length === 0 ? (
                  <div className="empty">Nenhuma saída registrada ainda.<br /><span style={{ fontSize: "0.78rem" }}>Use o formulário acima para adicionar.</span></div>
                ) : (
                  <div className="entry-list">
                    {saidas.map((g) => {
                      const av = AVATAR_COLORS[g.pessoa] ?? ["#f5f3ff", "#7c3aed"];
                      return (
                        <div key={g.id} className="entry-item">
                          <div className="avatar" style={{ background: av[0], color: av[1] }}>{initials(g.pessoa)}</div>
                          <div className="entry-body">
                            <div className="entry-head">
                              <span className="entry-nome">{g.pessoa}</span>
                              <span className="tag tag-cat">{g.categoria}</span>
                            </div>
                            <div className="entry-foot">
                              <span className="entry-desc">{g.descricao}</span>
                              <span className="entry-valor" style={{ color: "#dc2626" }}>{fmt(Number(g.valor))}</span>
                            </div>
                          </div>
                          <button className="icon-btn" onClick={() => { setGastoParaExcluir(g.id); setModalExcluir(true); }} aria-label="Remover">🗑</button>
                        </div>
                      );
                    })}
                    <div className="entry-footer">
                      <span className="entry-footer-label">Total de saídas</span>
                      <span className="entry-footer-total" style={{ color: "#dc2626" }}>{fmt(totalSaidas)}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav">
        <button className={`bottom-btn ${tab === "painel" ? "active" : ""}`} onClick={() => setTab("painel")}>
          <span style={{ fontSize: "1.3rem" }}>📊</span><span>Painel</span>
        </button>
        <button className={`bottom-btn ${tab === "entradas" ? "active" : ""}`} onClick={() => setTab("entradas")}>
          <span style={{ fontSize: "1.3rem" }}>💰</span><span>Entradas</span>
        </button>
        <button className="bottom-add" onClick={() => setTab("entradas")}>+</button>
        <button className={`bottom-btn ${tab === "saidas" ? "active" : ""}`} onClick={() => setTab("saidas")}>
          <span style={{ fontSize: "1.3rem" }}>💸</span><span>Saídas</span>
        </button>
      </div>

      {/* ── MODAL ── */}
      {modalExcluir && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Excluir lançamento</h3>
            <p>Tem certeza que deseja excluir este lançamento? Essa ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setModalExcluir(false)}>Cancelar</button>
              <button className="btn-danger" onClick={async () => {
                if (gastoParaExcluir) await remover(gastoParaExcluir);
                setModalExcluir(false);
                setGastoParaExcluir(null);
              }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

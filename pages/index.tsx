"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PESSOAS = ["Alba", "Evandro", "João"];
const CATEGORIAS = ["Salário", "Aluguel", "Conta Fixa", "Gasto Variável"];
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
  Alba: ["#F5C4B3", "#993C1D"],
  Evandro: ["#B5D4F4", "#0C447C"],
  João: ["#C0DD97", "#3B6D11"],
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
  const [usuario, setUsuario] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState("");

  const [form, setForm] = useState({
    pessoa: "",
    categoria: "",
    descricao: "",
    valor: "",
  });

  // Verifica login + carrega usuário
  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUsuario(user);
    }
    init();
  }, []);

  useEffect(() => {
    carregarGastos();

    const channel = supabase
      .channel("gastos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gastos" },
        () => carregarGastos(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function carregarGastos() {
    const { data, error } = await supabase
      .from("gastos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return console.error(error);
    setGastos(data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function adicionarGasto() {
    if (!form.pessoa || !form.categoria || !form.descricao || !form.valor) {
      alert("Preencha todos os campos");
      return;
    }
    const c = form.categoria.toLowerCase();
    const tipo =
      c.includes("salário") || c.includes("salario") || c.includes("aluguel")
        ? "Entrada"
        : "Saída";

    const { data, error } = await supabase
      .from("gastos")
      .insert([
        {
          tipo,
          pessoa: form.pessoa,
          categoria: form.categoria,
          descricao: form.descricao,
          valor: Number(form.valor),
        },
      ])
      .select();

    if (error) {
      console.error(error);
      alert("Erro ao salvar");
      return;
    }

    setGastos((prev) => [data[0], ...prev]);
    setMensagemSucesso(true);
    setTimeout(() => setMensagemSucesso(false), 3000);
    setForm({ pessoa: "", categoria: "", descricao: "", valor: "" });
    setShowForm(false);
  }

  async function remover(id: number) {
    const { error } = await supabase.from("gastos").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Erro ao excluir");
      return;
    }
    await carregarGastos();
  }

  // Filtro pela aba
  const lista = gastos
    .filter((g) => {
      if (!mesSelecionado) return true;

      const mesGasto = String(new Date(g.created_at!).getMonth() + 1).padStart(
        2,
        "0",
      );

      return mesGasto === mesSelecionado;
    })
    .filter((g) =>
      tab === "entradas"
        ? g.tipo === "Entrada"
        : tab === "saidas"
          ? g.tipo === "Saída"
          : true,
    );

  const totalEntradas = gastos
    .filter((g) => g.tipo === "Entrada")
    .reduce((a, g) => a + Number(g.valor), 0);
  const totalSaidas = gastos
    .filter((g) => g.tipo === "Saída")
    .reduce((a, g) => a + Number(g.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  const nomeUsuario =
    usuario?.user_metadata?.full_name || usuario?.email?.split("@")[0] || "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .app-root {
          min-height: 100vh;
          background: #0f0f11;
          color: #f1f5f9;
          font-family: 'Inter', sans-serif;
        }

        /* NAVBAR */
        .navbar {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.85rem 1.5rem;
          background: rgba(15,15,17,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #1f1f28;
        }
        .nav-brand {
          font-size: 1.15rem; font-weight: 700; color: #fff;
          letter-spacing: -0.3px;
        }
        .nav-brand span { color: #818cf8; }

        .nav-tabs { display: flex; gap: 0.25rem; }
        .nav-tab {
          padding: 0.5rem 1rem; border: none; background: transparent;
          color: #64748b; font-size: 0.875rem; font-weight: 500;
          border-radius: 8px; cursor: pointer; transition: all 0.2s;
          font-family: inherit;
        }
        .nav-tab:hover { color: #e2e8f0; background: #1c1c24; }
        .nav-tab.active { color: #fff; background: #1c1c24; }

        .nav-right { display: flex; align-items: center; gap: 0.75rem; }
        .nav-user {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 0.85rem; border-radius: 999px;
          background: #1c1c24; border: 1px solid #2d2d3a;
          font-size: 0.85rem; color: #e2e8f0;
        }
        .nav-user-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 600; color: #fff;
        }
        .nav-logout {
          background: none; border: none; color: #64748b;
          font-size: 0.8rem; cursor: pointer; padding: 0.4rem 0.6rem;
          border-radius: 6px;
        }
        .nav-logout:hover { color: #f87171; background: #1c1c24; }

        .btn-cta {
          padding: 0.5rem 1rem; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.35);
        }

        .hamburger {
          display: none;
          background: none; border: none; color: #e2e8f0;
          font-size: 1.3rem; cursor: pointer;
        }

        @media (max-width: 768px) {
          .nav-tabs { display: none; }
          .nav-tabs.open {
            display: flex; flex-direction: column;
            position: absolute; top: 100%; left: 0; right: 0;
            background: #0f0f11; border-bottom: 1px solid #1f1f28;
            padding: 0.5rem;
          }
          .hamburger { display: block; }
          .nav-user span.name { display: none; }
        }

        /* MAIN */
        .container {
          max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem;
        }
        .page-title {
          font-size: 1.75rem; font-weight: 700; color: #f1f5f9;
          margin-bottom: 0.3rem; letter-spacing: -0.5px;
        }
        .page-sub { color: #64748b; font-size: 0.9rem; margin-bottom: 2rem; }

        .success-msg {
          padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1.25rem;
          background: rgba(34,197,94,0.1); color: #4ade80;
          border: 1px solid rgba(34,197,94,0.2); font-size: 0.875rem;
        }

        /* CARDS */
        .metrics {
          display: grid; gap: 1rem; margin-bottom: 2rem;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 700px) { .metrics { grid-template-columns: 1fr; } }
        .metric-card {
          background: linear-gradient(180deg, #1c1c24 0%, #16161c 100%);
          border: 1px solid #2d2d3a; border-radius: 14px;
          padding: 1.25rem 1.5rem;
        }
        .metric-label { font-size: 0.78rem; color: #64748b; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 1.5rem; font-weight: 700; }

        /* PANEL */
        .panel {
          background: #16161c; border: 1px solid #2d2d3a;
          border-radius: 14px; padding: 1.5rem; margin-bottom: 1.5rem;
        }
        .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .panel-title { font-size: 1rem; font-weight: 600; color: #f1f5f9; }

        .form-grid {
          display: grid; gap: 0.9rem;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

        .field-label { display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 0.4rem; font-weight: 500; }
        .field-input, .field-select {
          width: 100%; padding: 0.7rem 0.85rem; border-radius: 9px;
          border: 1px solid #2d2d3a; background: #1c1c24;
          color: #f1f5f9; font-size: 0.875rem; outline: none;
          font-family: inherit; transition: border-color 0.2s;
        }
        .field-input::placeholder { color: #475569; }
        .field-input:focus, .field-select:focus { border-color: #6366f1; }

        .btn-primary {
          padding: 0.7rem 1.25rem; border-radius: 9px; border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.35);
        }
        .btn-ghost {
          padding: 0.7rem 1.25rem; border-radius: 9px;
          background: transparent; border: 1px solid #2d2d3a;
          color: #e2e8f0; font-size: 0.875rem; font-weight: 500;
          cursor: pointer;
        }
        .btn-ghost:hover { border-color: #6366f1; }

        /* TABLE */
        table { width: 100%; border-collapse: collapse; }
        thead th {
          text-align: left; font-size: 0.72rem; font-weight: 600;
          color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;
          padding: 0.6rem 0.75rem; border-bottom: 1px solid #2d2d3a;
        }
        tbody td {
          padding: 0.85rem 0.75rem; font-size: 0.875rem;
          border-bottom: 1px solid #1f1f28; color: #e2e8f0;
        }
        tbody tr:hover { background: #1a1a22; }

        .tag {
          display: inline-block; padding: 0.2rem 0.6rem;
          border-radius: 999px; font-size: 0.72rem; font-weight: 500;
        }
        .tag-entrada { background: rgba(34,197,94,0.12); color: #4ade80; }
        .tag-saida { background: rgba(239,68,68,0.12); color: #f87171; }
        .tag-cat { background: #1c1c24; color: #94a3b8; border: 1px solid #2d2d3a; }

        .pessoa-cell { display: flex; align-items: center; gap: 0.5rem; }
        .avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 600;
        }

        .empty {
          text-align: center; padding: 3rem 1rem; color: #475569;
          font-size: 0.9rem;
        }

        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: #64748b; font-size: 1rem; padding: 0.35rem 0.5rem;
          border-radius: 6px;
        }
        .icon-btn:hover { color: #f87171; background: #1c1c24; }

        /* MODAL */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 1rem;
        }
        .modal {
          background: #16161c; border: 1px solid #2d2d3a;
          border-radius: 14px; padding: 1.75rem; max-width: 380px; width: 100%;
        }
        .modal h3 { font-size: 1.1rem; color: #f1f5f9; margin-bottom: 0.5rem; }
        .modal p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.25rem; }
        .modal-actions { display: flex; gap: 0.6rem; justify-content: flex-end; }
        .btn-danger {
          padding: 0.6rem 1.1rem; border-radius: 8px; border: none;
          background: #dc2626; color: #fff; font-size: 0.85rem; font-weight: 600;
          cursor: pointer;
        }
          .bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: #16161c;
  border-top: 1px solid #2d2d3a;
  display: none;
  justify-content: space-around;
  align-items: center;
  z-index: 999;
}

.bottom-btn {
  background: none;
  border: none;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.bottom-btn.active {
  color: #818cf8;
}

.bottom-add {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(
    135deg,
    #6366f1,
    #8b5cf6
  );
  color: white;
  font-size: 32px;
  margin-top: -25px;
  cursor: pointer;
}

@media (max-width:768px) {

  .bottom-nav {
    display: flex;
  }

  .container {
    padding-bottom: 100px;
  }

  .hamburger {
    display: none;
  }
}
      `}</style>

      <div className="app-root">
        {/* NAVBAR */}
        <nav className="navbar">
          <div className="nav-brand">
            Organização<span>Financeira</span>
          </div>

          <div className={`nav-tabs ${menuOpen ? "open" : ""}`}>
            <button
              className={`nav-tab ${tab === "painel" ? "active" : ""}`}
              onClick={() => {
                setTab("painel");
                setMenuOpen(false);
              }}
            >
              Painel geral
            </button>
            <button
              className={`nav-tab ${tab === "entradas" ? "active" : ""}`}
              onClick={() => {
                setTab("entradas");
                setMenuOpen(false);
              }}
            >
              Entradas
            </button>
            <button
              className={`nav-tab ${tab === "saidas" ? "active" : ""}`}
              onClick={() => {
                setTab("saidas");
                setMenuOpen(false);
              }}
            >
              Saídas
            </button>
          </div>

          <div className="nav-right">
            {usuario ? (
              <>
                <div className="nav-user">
                  <div className="nav-user-avatar">
                    {initials(nomeUsuario || "U")}
                  </div>
                  <span className="name">{nomeUsuario}</span>
                </div>
                <button className="nav-logout" onClick={logout}>
                  Sair
                </button>
              </>
            ) : (
              <button
                className="btn-cta"
                onClick={() => (window.location.href = "/login")}
              >
                Entrar
              </button>
            )}
            <button
              className="hamburger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </nav>

        {/* CONTENT */}
        <main className="container">
          <h1 className="page-title">
            {tab === "painel" && "Painel geral"}
            {tab === "entradas" && "Entradas"}
            {tab === "saidas" && "Saídas"}
          </h1>
          <p className="page-sub">
            {nomeUsuario
              ? `Olá, ${nomeUsuario} 👋`
              : "Visão geral dos seus gastos"}
          </p>

          {mensagemSucesso && (
            <div className="success-msg">✅ Gasto adicionado com sucesso!</div>
          )}

          {/* METRICS */}
          <div className="metrics">
            <div className="metric-card">
              <div className="metric-label">Entradas</div>
              <div className="metric-value" style={{ color: "#4ade80" }}>
                {fmt(totalEntradas)}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Saídas</div>
              <div className="metric-value" style={{ color: "#f87171" }}>
                {fmt(totalSaidas)}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Saldo</div>
              <div
                className="metric-value"
                style={{ color: saldo >= 0 ? "#818cf8" : "#f87171" }}
              >
                {fmt(saldo)}
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Novo lançamento</div>
              <button
                className="btn-ghost"
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? "Cancelar" : "+ Adicionar"}
              </button>
            </div>

            {showForm && (
              <>
                <div className="form-grid">
                  <div>
                    <label className="field-label">Pessoa</label>
                    <select
                      className="field-select"
                      value={form.pessoa}
                      onChange={(e) =>
                        setForm({ ...form, pessoa: e.target.value })
                      }
                    >
                      <option value="">Selecione</option>
                      {PESSOAS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Categoria</label>
                    <select
                      className="field-select"
                      value={form.categoria}
                      onChange={(e) =>
                        setForm({ ...form, categoria: e.target.value })
                      }
                    >
                      <option value="">Selecione</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Descrição</label>
                    <input
                      className="field-input"
                      placeholder="ex: Mercado"
                      value={form.descricao}
                      onChange={(e) =>
                        setForm({ ...form, descricao: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">Valor (R$)</label>
                    <input
                      className="field-input"
                      type="number"
                      placeholder="0,00"
                      value={form.valor}
                      onChange={(e) =>
                        setForm({ ...form, valor: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div style={{ marginTop: "1.1rem", textAlign: "right" }}>
                  <button className="btn-primary" onClick={adicionarGasto}>
                    Salvar lançamento
                  </button>
                </div>
              </>
            )}
          </div>

          {/* TABLE */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                {tab === "painel" && "Todos os lançamentos"}
                {tab === "entradas" && "Entradas"}
                {tab === "saidas" && "Saídas"}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <select
                  className="field-select"
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  style={{ width: "180px" }}
                >
                  <option value="">Todos os meses</option>

                  {MESES.map((mes) => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>

                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#64748b",
                  }}
                >
                  {lista.length} {lista.length === 1 ? "item" : "itens"}
                </span>
              </div>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                {lista.length} {lista.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {lista.length === 0 ? (
              <div className="empty">Nenhum lançamento cadastrado ainda.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Pessoa</th>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th style={{ textAlign: "right" }}>Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((g) => {
                      const av = AVATAR_COLORS[g.pessoa] ?? [
                        "#2d2d3a",
                        "#e2e8f0",
                      ];
                      return (
                        <tr key={g.id}>
                          <td>
                            <span
                              className={`tag ${g.tipo === "Entrada" ? "tag-entrada" : "tag-saida"}`}
                            >
                              {g.tipo}
                            </span>
                          </td>
                          <td>
                            <div className="pessoa-cell">
                              <div
                                className="avatar"
                                style={{ background: av[0], color: av[1] }}
                              >
                                {initials(g.pessoa)}
                              </div>
                              {g.pessoa}
                            </div>
                          </td>
                          <td>
                            <span className="tag tag-cat">{g.categoria}</span>
                          </td>
                          <td>{g.descricao}</td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 600,
                              color:
                                g.tipo === "Entrada" ? "#4ade80" : "#f87171",
                            }}
                          >
                            {fmt(Number(g.valor))}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="icon-btn"
                              onClick={() => {
                                setGastoParaExcluir(g.id);
                                setModalExcluir(true);
                              }}
                              aria-label="Remover"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
      <div className="bottom-nav">
        <button
          className={`bottom-btn ${tab === "painel" ? "active" : ""}`}
          onClick={() => setTab("painel")}
        >
          📊
          <span>Painel</span>
        </button>

        <button
          className={`bottom-btn ${tab === "entradas" ? "active" : ""}`}
          onClick={() => setTab("entradas")}
        >
          💰
          <span>Entradas</span>
        </button>

        <button className="bottom-add" onClick={() => setShowForm(true)}>
          +
        </button>

        <button
          className={`bottom-btn ${tab === "saidas" ? "active" : ""}`}
          onClick={() => setTab("saidas")}
        >
          💸
          <span>Saídas</span>
        </button>

        <button className="bottom-btn" onClick={logout}>
          🚪
          <span>Sair</span>
        </button>
      </div>
      {modalExcluir && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Excluir lançamento</h3>
            <p>
              Tem certeza que deseja excluir este lançamento? Essa ação não pode
              ser desfeita.
            </p>
            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={() => setModalExcluir(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={async () => {
                  if (gastoParaExcluir) await remover(gastoParaExcluir);
                  setModalExcluir(false);
                  setGastoParaExcluir(null);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

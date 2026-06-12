"use client";

import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";

const PESSOAS = ["Alba", "Evandro", "João"];
const CATEGORIAS = ["Conta Fixa", "Gasto Variável", "Gasto Esporádico"];

const AVATAR_COLORS: Record<string, [string, string]> = {
  Alba: ["#F5C4B3", "#993C1D"],
  Evandro: ["#B5D4F4", "#0C447C"],
  João: ["#C0DD97", "#3B6D11"],
};

type Gasto = {
  id: number;
  pessoa: string;
  categoria: string;
  descricao: string;
  valor: number;
  created_at?: string;
};

type View = "painel" | "novo" | "lista";

function fmt(v: number) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function badgeStyle(cat: string) {
  if (cat === "Conta Fixa") return { background: "#E6F1FB", color: "#0C447C" };
  if (cat === "Gasto Variável")
    return { background: "#EAF3DE", color: "#27500A" };
  return { background: "#FAEEDA", color: "#633806" };
}

export default function Home() {
  const [gastoParaExcluir, setGastoParaExcluir] = useState<number | null>(null);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [filtro, setFiltro] = useState("");
  const [view, setView] = useState<View>("painel");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pessoasOpen, setPessoasOpen] = useState(true);
  const [form, setForm] = useState({
    pessoa: "",
    categoria: "",
    descricao: "",
    valor: "",
  });

  useEffect(() => {
    carregarGastos();
  }, []);

  async function carregarGastos() {
    const { data, error } = await supabase
      .from("gastos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setGastos(data || []);
  }

  async function adicionarGasto() {
    if (!form.pessoa || !form.categoria || !form.descricao || !form.valor) {
      alert("Preencha todos os campos");
      return;
    }

    const { data, error } = await supabase
      .from("gastos")
      .insert([
        {
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

    setGastos((prev) => [...prev, data[0]]);

    setForm({
      pessoa: "",
      categoria: "",
      descricao: "",
      valor: "",
    });
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

  const lista = filtro ? gastos.filter((g) => g.pessoa === filtro) : gastos;
  const totalGeral = gastos.reduce((a, g) => a + Number(g.valor), 0);
  const totalFixas = gastos
    .filter((g) => g.categoria === "Conta Fixa")
    .reduce((a, g) => a + Number(g.valor), 0);
  const totalVariaveis = gastos
    .filter((g) => g.categoria === "Gasto Variável")
    .reduce((a, g) => a + Number(g.valor), 0);

  const viewTitles: Record<View, string> = {
    painel: "Painel",
    novo: "Novo gasto",
    lista: "Todos os gastos",
  };

  const navItem = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={() => {
        onClick();
        setSidebarOpen(false);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 16px",
        fontSize: 14,
        cursor: "pointer",
        background: active ? "#fff" : "transparent",
        color: active ? "#185FA5" : "#64748b",
        fontWeight: active ? 500 : 400,
        border: "none",
        borderRight: active ? "2px solid #185FA5" : "2px solid transparent",
        width: "100%",
        textAlign: "left",
      }}
    >
      {label}
    </button>
  );

  const inputStyle: React.CSSProperties = {
    padding: "9px 11px",
    borderRadius: 8,
    border: "0.5px solid #d1d5db",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    background: "#f8fafc",
    color: "#1e293b",
    fontFamily: "inherit",
    outline: "none",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "16px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          border: "0.5px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
          minHeight: "85vh",
          background: "#fff",
          position: "relative",
        }}
      >
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 10,
            }}
          />
        )}

        {/* Sidebar */}
        <nav
          className={sidebarOpen ? "sidebar sidebar-open" : "sidebar"}
          style={{
            position: "absolute",
            left: sidebarOpen ? 0 : -220,
            top: 0,
            height: "100%",
            width: 220,
            transition: "all 0.3s ease",
            zIndex: 20,
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              padding: "18px 16px 12px",
              borderBottom: "0.5px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontWeight: 500,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#1e293b",
              }}
            >
              <span style={{ fontSize: 20 }}>💰</span>
              Gastos
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                color: "#64748b",
              }}
            >
              ☰
            </button>
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "14px 16px 6px",
            }}
          >
            Menu
          </div>

          {navItem("📊 Painel", view === "painel" && !filtro, () => {
            setView("painel");
            setFiltro("");
          })}
          {navItem("➕ Novo gasto", view === "novo", () => setView("novo"))}
          {navItem("📋 Todos os gastos", view === "lista" && !filtro, () => {
            setView("lista");
            setFiltro("");
          })}

          {/* Cabeçalho do submenu "Por pessoa" - clicável para esconder/mostrar */}
          <button
            onClick={() => setPessoasOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "14px 16px 6px",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              "👥" : "Por pessoa"
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                transform: pessoasOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.2s ease",
                display: "inline-block",
              }}
            >
              ▾
            </span>
          </button>

          {/* Itens do submenu - só renderiza se pessoasOpen for true */}
          {pessoasOpen && (
            <>
              {navItem("👥 Todos", !filtro && view !== "novo", () => {
                setFiltro("");
                setView("lista");
              })}
              {PESSOAS.map((p) =>
                navItem(`👤 ${p}`, filtro === p, () => {
                  setFiltro(p);
                  setView("lista");
                }),
              )}
            </>
          )}

          <div
            style={{
              marginTop: "auto",
              padding: "14px 16px",
              borderTop: "0.5px solid #e2e8f0",
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            Dados salvos na sessão
          </div>
        </nav>

        {/* Main */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Topbar */}
          <div
            style={{
              padding: "13px 20px",
              borderBottom: "0.5px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hamburger-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 20,
                  color: "#64748b",
                  padding: "2px 4px",
                  display: "block",
                }}
                aria-label="Abrir menu"
              >
                ☰
              </button>
              <span style={{ fontWeight: 500, fontSize: 15 }}>
                {filtro ? `Gastos de ${filtro}` : viewTitles[view]}
              </span>
            </div>
            {filtro && (
              <button
                onClick={() => setFiltro("")}
                style={{
                  fontSize: 12,
                  color: "#185FA5",
                  background: "#E6F1FB",
                  border: "none",
                  borderRadius: 20,
                  padding: "4px 12px",
                  cursor: "pointer",
                }}
              >
                ✕ Limpar filtro
              </button>
            )}
          </div>

          <div style={{ padding: 20, flex: 1, overflowY: "auto" }}>
            {/* Metric Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {[
                {
                  label: "Total geral",
                  value: fmt(totalGeral),
                  color: "#0F6E56",
                },
                {
                  label: "Nº de gastos",
                  value: String(gastos.length),
                  color: "#185FA5",
                },
                {
                  label: "Contas fixas",
                  value: fmt(totalFixas),
                  color: "#1e293b",
                },
                {
                  label: "Variáveis",
                  value: fmt(totalVariaveis),
                  color: "#854F0B",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  style={{
                    background: "#f8fafc",
                    borderRadius: 8,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}
                  >
                    {c.label}
                  </div>
                  <div
                    style={{ fontSize: 22, fontWeight: 500, color: c.color }}
                  >
                    {c.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            {view !== "lista" && (
              <div
                style={{
                  border: "0.5px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 14,
                  }}
                >
                  Novo gasto
                </div>

                <div className="form-grid">
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      Pessoa
                    </label>
                    <select
                      value={form.pessoa}
                      onChange={(e) =>
                        setForm({ ...form, pessoa: e.target.value })
                      }
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {PESSOAS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      Categoria
                    </label>
                    <select
                      value={form.categoria}
                      onChange={(e) =>
                        setForm({ ...form, categoria: e.target.value })
                      }
                      style={inputStyle}
                    >
                      <option value="">Selecione</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      Descrição
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Aluguel, mercado…"
                      value={form.descricao}
                      onChange={(e) =>
                        setForm({ ...form, descricao: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      placeholder="0,00"
                      min={0}
                      step={0.01}
                      value={form.valor}
                      onChange={(e) =>
                        setForm({ ...form, valor: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 14,
                  }}
                >
                  <button
                    onClick={adicionarGasto}
                    style={{
                      background: "#185FA5",
                      color: "#fff",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: 8,
                      fontWeight: 500,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    + Adicionar gasto
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div
              style={{
                border: "0.5px solid #e2e8f0",
                borderRadius: 12,
                padding: 18,
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 14,
                }}
              >
                {filtro ? `Gastos de ${filtro}` : "Gastos registrados"}
              </div>
              {lista.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    padding: "28px 0",
                    color: "#94a3b8",
                    fontSize: 14,
                  }}
                >
                  Nenhum gasto cadastrado.
                </p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr>
                      {["Pessoa", "Categoria", "Descrição", "Valor", ""].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 12px",
                              textAlign: h === "Valor" ? "right" : "left",
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#94a3b8",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              borderBottom: "0.5px solid #e2e8f0",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((g) => {
                      const av = AVATAR_COLORS[g.pessoa] ?? [
                        "#D3D1C7",
                        "#444441",
                      ];
                      return (
                        <tr key={g.id}>
                          <td
                            style={{
                              padding: "11px 12px",
                              borderBottom: "0.5px solid #f1f5f9",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: "50%",
                                  background: av[0],
                                  color: av[1],
                                  fontSize: 11,
                                  fontWeight: 500,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {initials(g.pessoa)}
                              </span>
                              {g.pessoa}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              borderBottom: "0.5px solid #f1f5f9",
                            }}
                          >
                            <span
                              style={{
                                ...badgeStyle(g.categoria),
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            >
                              {g.categoria}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              borderBottom: "0.5px solid #f1f5f9",
                              color: "#475569",
                            }}
                          >
                            {g.descricao}
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              borderBottom: "0.5px solid #f1f5f9",
                              textAlign: "right",
                              fontWeight: 500,
                            }}
                          >
                            {fmt(Number(g.valor))}
                          </td>
                          <td
                            style={{
                              padding: "11px 12px",
                              borderBottom: "0.5px solid #f1f5f9",
                            }}
                          >
                            <button
                              onClick={() => {
                                setGastoParaExcluir(g.id);
                                setModalExcluir(true);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#94a3b8",
                                fontSize: 16,
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                              aria-label="Remover gasto"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
  .form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
`}</style>

      {modalExcluir && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: 320,
              textAlign: "center",
            }}
          >
            <h3>Excluir gasto</h3>

            <p>Deseja realmente excluir este gasto?</p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                onClick={() => setModalExcluir(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>

              <button
                onClick={async () => {
                  if (gastoParaExcluir) {
                    await remover(gastoParaExcluir);
                  }

                  setModalExcluir(false);
                  setGastoParaExcluir(null);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

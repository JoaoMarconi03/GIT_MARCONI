"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type Mode = "login" | "cadastro";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  // useEffect(() => {
  //   async function verificarLogin() {
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();
  //
  //     if (session) {
  //       window.location.href = "/";
  //     }
  //   }
  //
  //   verificarLogin();
  // }, []);

  async function handleSubmit() {
    setLoading(true);
    setMessage(null);

    if (mode === "cadastro") {
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { full_name: nome } },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Cadastro realizado! Verifique seu e-mail para confirmar.",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) {
        setMessage({ type: "error", text: "E-mail ou senha incorretos." });
      } else {
        window.location.href = "/";
      }
    }

    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://git-marconi.vercel.app/",
      },
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #0f0f11;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          display: none;
          flex: 1;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        }
        @media (min-width: 900px) { .auth-left { display: flex; flex-direction: column; justify-content: flex-end; padding: 3rem; } }

        .auth-left-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.25) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.15) 0%, transparent 50%);
        }

        .auth-left-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
        }
        .orb1 { width: 300px; height: 300px; top: -80px; left: -80px; background: #6366f1; }
        .orb2 { width: 200px; height: 200px; bottom: 100px; right: -50px; background: #a855f7; }

        .auth-left-content { position: relative; z-index: 1; }
        .auth-brand {
          font-size: 1.75rem; font-weight: 700; color: #fff;
          letter-spacing: -0.5px; margin-bottom: 1rem;
        }
        .auth-brand span { color: #818cf8; }
        .auth-tagline { font-size: 0.95rem; color: #94a3b8; line-height: 1.6; max-width: 320px; }

        /* ── RIGHT PANEL ── */
        .auth-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 2rem 1.5rem;
        }

        .auth-card {
          width: 100%; max-width: 400px;
        }

        .auth-logo-mobile {
          font-size: 1.5rem; font-weight: 700; color: #fff;
          letter-spacing: -0.5px; margin-bottom: 2rem; text-align: center;
          display: block;
        }
        .auth-logo-mobile span { color: #818cf8; }
        @media (min-width: 900px) { .auth-logo-mobile { display: none; } }

        /* TABS */
        .auth-tabs {
          display: flex; background: #1c1c24; border-radius: 10px;
          padding: 4px; margin-bottom: 2rem;
        }
        .auth-tab {
          flex: 1; padding: 0.6rem; border: none; border-radius: 8px;
          font-size: 0.875rem; font-weight: 500; cursor: pointer;
          transition: all 0.2s; background: transparent; color: #64748b;
        }
        .auth-tab.active {
          background: #6366f1; color: #fff;
          box-shadow: 0 2px 8px rgba(99,102,241,0.4);
        }

        /* TITLE */
        .auth-title { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.4rem; }
        .auth-subtitle { font-size: 0.875rem; color: #64748b; margin-bottom: 1.75rem; }

        /* GOOGLE BTN */
        .btn-google {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 0.65rem; padding: 0.75rem; border-radius: 10px;
          border: 1px solid #2d2d3a; background: #1c1c24;
          color: #e2e8f0; font-size: 0.9rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s; margin-bottom: 1.5rem;
        }
        .btn-google:hover { background: #252530; border-color: #6366f1; }
        .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

        /* DIVIDER */
        .divider {
          display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;
        }
        .divider-line { flex: 1; height: 1px; background: #2d2d3a; }
        .divider-text { font-size: 0.75rem; color: #475569; white-space: nowrap; }

        /* INPUTS */
        .field { margin-bottom: 1rem; }
        .field label { display: block; font-size: 0.8rem; font-weight: 500; color: #94a3b8; margin-bottom: 0.4rem; }
        .field input {
          width: 100%; padding: 0.75rem 1rem; border-radius: 10px;
          border: 1px solid #2d2d3a; background: #1c1c24;
          color: #f1f5f9; font-size: 0.9rem; outline: none;
          transition: border-color 0.2s;
        }
        .field input::placeholder { color: #475569; }
        .field input:focus { border-color: #6366f1; }

        /* MESSAGE */
        .auth-message {
          padding: 0.75rem 1rem; border-radius: 8px;
          font-size: 0.85rem; margin-bottom: 1rem;
        }
        .auth-message.error { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .auth-message.success { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }

        /* SUBMIT BTN */
        .btn-submit {
          width: 100%; padding: 0.8rem; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s; margin-top: 0.5rem;
          box-shadow: 0 4px 15px rgba(99,102,241,0.35);
        }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.5); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .auth-footer {
          text-align: center; margin-top: 1.5rem;
          font-size: 0.8rem; color: #475569;
        }
        .auth-footer button {
          background: none; border: none; color: #818cf8;
          cursor: pointer; font-size: 0.8rem; font-weight: 500;
        }
        .auth-footer button:hover { color: #a5b4fc; }
      `}</style>

      <div className="auth-root">
        {/* LEFT */}
        <div className="auth-left">
          <div className="auth-left-bg" />
          <div className="auth-orb orb1 auth-left-orb" />
          <div className="auth-orb orb2 auth-left-orb" />
          <div className="auth-left-content">
            <p className="auth-brand">
              meu<span>App</span>
            </p>
            <p className="auth-tagline">
              Acesse sua conta e continue de onde parou. Seguro, rápido e sempre
              disponível.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-right">
          <div className="auth-card">
            <span className="auth-logo-mobile">
              meu<span>App</span>
            </span>

            {/* TABS */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
              >
                Entrar
              </button>
              <button
                className={`auth-tab ${mode === "cadastro" ? "active" : ""}`}
                onClick={() => {
                  setMode("cadastro");
                  setMessage(null);
                }}
              >
                Criar conta
              </button>
            </div>

            <p className="auth-title">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </p>
            <p className="auth-subtitle">
              {mode === "login" ? "Entre para continuar" : "Rápido e gratuito"}
            </p>

            {/* GOOGLE */}
            <button
              className="btn-google"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
                />
              </svg>
              {googleLoading ? "Redirecionando..." : "Continuar com Google"}
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">ou use seu e-mail</span>
              <div className="divider-line" />
            </div>

            {message && (
              <div className={`auth-message ${message.type}`}>
                {message.text}
              </div>
            )}

            {mode === "cadastro" && (
              <div className="field">
                <label>Nome completo</label>
                <input
                  placeholder="João Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>

            <p className="auth-footer">
              {mode === "login" ? (
                <>
                  Não tem conta?{" "}
                  <button
                    onClick={() => {
                      setMode("cadastro");
                      setMessage(null);
                    }}
                  >
                    Criar agora
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      setMessage(null);
                    }}
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

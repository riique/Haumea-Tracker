import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      const errorCode = err instanceof FirebaseError ? err.code : '';
      if (errorCode === 'auth/invalid-credential') {
        setError('Credenciais inválidas.');
      } else if (errorCode === 'auth/user-not-found') {
        setError('Usuário não encontrado.');
      } else if (errorCode === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('Email já cadastrado.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sidebar rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-surfaceHighlight rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-10 shadow-xl relative z-10">
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-4xl font-display font-bold text-textMain mb-2 tracking-tight">
            Haumea<span className="text-accent">.</span>
          </h1>
          <p className="text-textMuted text-center font-mono text-xs uppercase tracking-widest">
            Performance & Metabolism Tracker
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg mb-8 text-sm font-medium flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider font-display">Email</label>
            <input
              type="email"
              className="w-full bg-surfaceHighlight/30 focus:bg-white transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-textMuted uppercase tracking-wider font-display">Senha</label>
            <input
              type="password"
              className="w-full bg-surfaceHighlight/30 focus:bg-white transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-textMain text-white hover:bg-black font-display font-bold text-sm uppercase tracking-widest py-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-70 mt-4"
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar na Plataforma' : 'Criar Nova Conta')}
          </button>
        </form>

        <div className="text-center mt-8 pt-8 border-t border-border">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-textMuted hover:text-accent font-medium transition-colors"
          >
            {isLogin ? "Ainda não tem acesso? Crie uma conta" : "Já possui cadastro? Fazer login"}
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] text-textMuted font-mono uppercase tracking-widest opacity-60">
          © 2025 Haumea Systems
        </p>
      </div>
    </div>
  );
};

export default Login;

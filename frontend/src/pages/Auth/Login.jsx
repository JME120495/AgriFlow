import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    const result = await login(identifier, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.message || 'Identifiants invalides.');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans bg-slate-900">
      {/* Colonne Gauche : Visuel & Branding */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-tr from-cocoa-900 via-slate-900 to-indigo-950 relative overflow-hidden">
        {/* Cercles de flou d'arrière-plan pour effet premium */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cocoa-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        
        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 bg-gradient-to-tr from-cocoa-500 to-indigo-600 rounded-xl shadow-lg shadow-cocoa-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AgriFlow <span className="text-cocoa-400 font-medium">ERP</span></span>
        </div>

        <div className="my-auto z-10 max-w-lg space-y-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            La gestion intelligente de la filière <span className="text-transparent bg-clip-text bg-gradient-to-r from-cocoa-400 to-indigo-400">cacao</span>.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Optimisez vos achats, suivez vos stocks, gérez les crédits de campagne et pilotez vos ventes depuis une plateforme SaaS sécurisée et performante.
          </p>
        </div>

        <div className="text-slate-400 text-xs z-10">
          © 2026 AgriFlow. Tous droits réservés.
        </div>
      </div>

      {/* Colonne Droite : Formulaire */}
      <div className="flex items-center justify-center p-8 bg-slate-950 border-l border-slate-800">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Connexion</h2>
            <p className="text-slate-400">Entrez vos identifiants pour accéder à votre espace de travail.</p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm animate-shake">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-semibold text-slate-300">
                E-mail ou Téléphone
              </label>
              <input
                id="identifier"
                type="text"
                placeholder="Ex: caissier@agriflow.com ou +2376xxxxxxxx"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cocoa-500/40 focus:border-cocoa-500 transition-all"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-300">
                  Mot de passe
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-cocoa-400 hover:text-cocoa-300 transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 bg-slate-900/50 border border-slate-800 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cocoa-500/40 focus:border-cocoa-500 transition-all"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="rounded border-slate-800 bg-slate-900/50 text-cocoa-500 focus:ring-0 focus:ring-offset-0"
              />
              <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none">
                Se souvenir de moi
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cocoa-600 to-cocoa-500 hover:from-cocoa-500 hover:to-cocoa-400 text-white font-bold rounded-xl shadow-lg shadow-cocoa-600/10 hover:shadow-cocoa-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

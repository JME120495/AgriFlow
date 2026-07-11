import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!identifier) {
      setErrorMsg('Veuillez saisir votre email ou téléphone.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    const result = await forgotPassword(identifier);
    setSubmitting(false);

    if (result.success) {
      setSuccessMsg('Un code temporaire de réinitialisation a été généré dans le journal système.');
      setStep(2);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    const result = await resetPassword(identifier, code, newPassword);
    setSubmitting(false);

    if (result.success) {
      setSuccessMsg('Votre mot de passe a été réinitialisé avec succès.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 font-sans">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
        
        <div className="flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au login</span>
          </Link>
          <span className="text-xs text-slate-500">Étape {step} sur 2</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">
            {step === 1 ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
          </h2>
          <p className="text-slate-400 text-sm">
            {step === 1 
              ? 'Entrez votre identifiant pour recevoir un code de vérification.' 
              : 'Saisissez le code reçu et définissez votre nouveau mot de passe.'
            }
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">E-mail ou Téléphone</label>
              <input
                type="text"
                placeholder="votre.email@agriflow.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-cocoa-500 transition-all animate-fade"
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-cocoa-600 hover:bg-cocoa-500 text-white font-bold rounded-xl transition-all hover:scale-[1.01]"
            >
              Envoyer le code
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Code de vérification</label>
              <input
                type="text"
                placeholder="Code à 6 chiffres"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-cocoa-500 transition-all text-center tracking-widest font-mono text-lg"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-cocoa-500 transition-all"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-cocoa-600 hover:bg-cocoa-500 text-white font-bold rounded-xl transition-all"
            >
              Mettre à jour le mot de passe
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

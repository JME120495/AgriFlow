import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Plus, DollarSign, Calendar, FileText, User, CreditCard } from 'lucide-react';

const CreditDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credit, setCredit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayForm, setRepayForm] = useState({
    amount: '',
    repaidAt: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    observations: '',
  });

  const fetchCredit = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/credits/${id}`);
      setCredit(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredit();
  }, [id]);

  const handleRepay = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/credits/${id}/repayments`, {
        ...repayForm,
        amount: parseFloat(repayForm.amount),
      });
      setShowRepayModal(false);
      fetchCredit();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du remboursement');
    }
  };

  const handleValidate = async () => {
    try {
      await api.post(`/api/v1/credits/${id}/validate`);
      fetchCredit();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de validation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Chargement des détails du crédit...
      </div>
    );
  }

  if (!credit) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Crédit introuvable.
      </div>
    );
  }

  const repaidPercent = Math.min(100, Math.round((Number(credit.amountRepaid) / Number(credit.amountGranted)) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation */}
        <button
          onClick={() => navigate('/credits')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} /> Retour aux crédits
        </button>

        {/* Header card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-mono text-emerald-400">{credit.creditNumber}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                credit.status === 'ACTIVE' ? 'bg-teal-500/10 text-teal-400' :
                credit.status === 'REPAID' ? 'bg-emerald-500/10 text-emerald-400' :
                credit.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-500' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                {credit.status}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">{credit.category?.label}</p>
          </div>

          <div className="flex gap-3">
            {credit.status === 'PENDING_VALIDATION' && (
              <button
                onClick={handleValidate}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg transition-all"
              >
                Valider le crédit
              </button>
            )}
            {(credit.status === 'ACTIVE' || credit.status === 'OVERDUE') && (
              <button
                onClick={() => setShowRepayModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg transition-all"
              >
                <Plus size={18} /> Enregistrer un Remboursement
              </button>
            )}
          </div>
        </div>

        {/* Progress and main stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Circular/Jauge de progression */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Progression</h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Outer circle track */}
              <div className="absolute inset-0 rounded-full border-8 border-slate-800"></div>
              {/* Actual progress indicator */}
              <div className="text-2xl font-extrabold text-emerald-400">{repaidPercent}%</div>
            </div>
            <p className="text-slate-400 text-xs text-center">
              {Number(credit.amountRepaid).toLocaleString()} XOF remboursés sur {Number(credit.amountGranted).toLocaleString()} XOF
            </p>
          </div>

          {/* Details stats */}
          <div className="col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Informations Financières</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg"><DollarSign size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500">Montant Accordé</p>
                  <p className="text-lg font-bold">{Number(credit.amountGranted).toLocaleString()} XOF</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-500/10 text-teal-300 rounded-lg"><DollarSign size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500">Solde Restant</p>
                  <p className="text-lg font-bold text-teal-300">{Number(credit.balance).toLocaleString()} XOF</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-slate-400 rounded-lg"><Calendar size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500">Date d'octroi</p>
                  <p className="text-sm font-semibold">{new Date(credit.grantedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-slate-400 rounded-lg"><Calendar size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500">Échéance</p>
                  <p className="text-sm font-semibold">{new Date(credit.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History of repayments */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-bold">Historique des remboursements</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Date</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Méthode</th>
                <th className="p-4">Enregistré par</th>
                <th className="p-4">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {credit.repayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-500">Aucun remboursement enregistré.</td>
                </tr>
              ) : (
                credit.repayments.map((r) => (
                  <tr key={r.id} className="text-slate-300">
                    <td className="p-4 text-sm">{new Date(r.repaidAt || r.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-semibold text-emerald-400">{Number(r.amount).toLocaleString()} XOF</td>
                    <td className="p-4 text-xs">{r.paymentMethod}</td>
                    <td className="p-4 text-sm">{r.user?.firstName} {r.user?.lastName}</td>
                    <td className="p-4 text-sm text-slate-400">{r.observations || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Repayment Modal */}
        {showRepayModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 shadow-2xl space-y-6">
              <h2 className="text-2xl font-bold text-slate-100">Enregistrer un Remboursement</h2>
              <form onSubmit={handleRepay} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Montant (XOF)</label>
                  <input
                    type="number"
                    max={Number(credit.balance)}
                    value={repayForm.amount}
                    onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Solde restant exigible: {Number(credit.balance).toLocaleString()} XOF</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Date du Remboursement</label>
                  <input
                    type="date"
                    value={repayForm.repaidAt}
                    onChange={(e) => setRepayForm({ ...repayForm, repaidAt: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Mode de Paiement</label>
                  <select
                    value={repayForm.paymentMethod}
                    onChange={(e) => setRepayForm({ ...repayForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CASH">Espèces</option>
                    <option value="BANK_TRANSFER">Virement Bancaire</option>
                    <option value="MOBILE_MONEY">Mobile Money (Wave/Orange)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Observations</label>
                  <textarea
                    value={repayForm.observations}
                    onChange={(e) => setRepayForm({ ...repayForm, observations: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRepayModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CreditDetails;

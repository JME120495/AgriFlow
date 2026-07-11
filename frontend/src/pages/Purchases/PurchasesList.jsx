import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, Plus, Eye, DollarSign, Award, TrendingUp, ShieldAlert, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PurchasesList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ totalWeight: 0, totalAmount: 0, totalCount: 0 });

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/purchases');
      setPurchases(res.data || []);

      const statsRes = await api.get('/api/v1/purchases/stats');
      setStats(statsRes.data || { totalWeight: 0, totalAmount: 0, totalCount: 0 });
    } catch (err) {
      console.error('Erreur chargement achats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handlePay = async (id) => {
    try {
      await api.post(`/api/v1/purchases/${id}/pay`);
      fetchPurchases();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du paiement');
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = !search || p.purchaseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Achats de Cacao
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Suivi des pesées, analyses de qualité et validations de paiement des récoltes de cacao.
            </p>
          </div>
          <button
            onClick={() => navigate('/purchases/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={18} /> Enregistrer un Achat
          </button>
        </div>

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl backdrop-blur-md">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Volume Total Acheté</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">
                {Math.round(stats.totalWeight).toLocaleString()} kg
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><TrendingUp size={24} /></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl backdrop-blur-md">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Montant Brut Payé</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-100">
                {Math.round(stats.totalAmount).toLocaleString()} XOF
              </h3>
            </div>
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><DollarSign size={24} /></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl backdrop-blur-md">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Transactions Totales</p>
              <h3 className="text-2xl font-bold mt-1 text-teal-300">
                {stats.totalCount} livraisons
              </h3>
            </div>
            <div className="p-3 bg-teal-500/10 text-teal-300 rounded-xl"><Award size={24} /></div>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Rechercher par n° de transaction..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING_PAYMENT">En attente de paiement</option>
              <option value="PAID">Payé</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-5">Numéro</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Planteur</th>
                  <th className="p-5">Poids Net</th>
                  <th className="p-5">Réfactions</th>
                  <th className="p-5">Poids Payé</th>
                  <th className="p-5">Montant Net</th>
                  <th className="p-5">Qualité</th>
                  <th className="p-5">Statut</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="p-10 text-center text-slate-500">Chargement des achats...</td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-10 text-center text-slate-500">Aucun achat enregistré.</td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-5 font-mono text-emerald-400">{p.purchaseNumber}</td>
                      <td className="p-5 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-5 font-medium text-slate-200">
                        {p.planter ? `${p.planter.firstName} ${p.planter.lastName}` : 'Sous-Acheteur'}
                      </td>
                      <td className="p-5 text-slate-300">{p.weightNet.toFixed(1)} kg</td>
                      <td className="p-5 text-rose-400 font-semibold">-{p.weightRefactionKg.toFixed(1)} kg</td>
                      <td className="p-5 font-bold text-slate-100">{p.weightNetPaid.toFixed(1)} kg</td>
                      <td className="p-5 font-semibold text-emerald-400">{Number(p.amountNetPaid).toLocaleString()} XOF</td>
                      <td className="p-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.qualityGrade === 'GRADE_1' ? 'bg-emerald-500/10 text-emerald-400' :
                          p.qualityGrade === 'GRADE_2' ? 'bg-teal-500/10 text-teal-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {p.qualityGrade}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400 animate-pulse'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-5 text-right flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/purchases/${p.id}/quality`)}
                          title="Contrôle Qualité"
                          className="p-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white rounded-lg transition-all"
                        >
                          <Award size={16} />
                        </button>
                        {p.status === 'PENDING_PAYMENT' && (
                          <button
                            onClick={() => handlePay(p.id)}
                            title="Valider le paiement"
                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PurchasesList;

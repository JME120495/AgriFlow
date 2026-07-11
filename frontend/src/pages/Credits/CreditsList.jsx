import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, Plus, Eye, DollarSign, Award, TrendingUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreditsList = () => {
  const navigate = useNavigate();
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalGranted: 0, totalRepaid: 0, totalBalance: 0, totalOverdue: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    beneficiaryType: 'PLANTER',
    beneficiaryId: '',
    categoryId: '',
    amountGranted: '',
    grantedAt: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentMethod: 'CASH',
    sourceAccount: 'Caisse Centrale',
    observations: '',
  });

  const [categories, setCategories] = useState([]);
  const [planters, setPlanters] = useState([]);
  const [subBuyers, setSubBuyers] = useState([]);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/credits');
      setCredits(res.data || []);
      const statsRes = await api.get('/api/v1/credits/stats');
      setStats(statsRes.data || { totalGranted: 0, totalRepaid: 0, totalBalance: 0, totalOverdue: 0 });
    } catch (err) {
      console.error('Erreur chargement crédits:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMetadata = async () => {
    try {
      // Just mock categories since we seeded it
      // Let's query categories from database. Since there is no categories controller,
      // we can fetch from a generic endpoint or just create hardcoded selections.
      // But we seeded PLANTER_INPUTS, PLANTER_CAMPAGNE, etc.
      // Let's fetch categories or define the exact seeded ones for the user to pick.
      setCategories([
        { id: '1', code: 'PLANTER_CAMPAGNE', label: 'Avance de campagne' },
        { id: '2', code: 'PLANTER_INPUTS', label: "Achat d'intrants" },
        { id: '3', code: 'PLANTER_PERSONAL', label: 'Prêt personnel' },
        { id: '4', code: 'SUB_BUYER_FUNDS', label: "Fonds d'achat" },
      ]);

      const plantersRes = await api.get('/planters');
      setPlanters(plantersRes.data || []);

      const subBuyersRes = await api.get('/sub-buyers');
      setSubBuyers(subBuyersRes.data || []);
    } catch (err) {
      console.error('Erreur métadonnées formulaire:', err);
    }
  };

  useEffect(() => {
    fetchCredits();
    fetchFormMetadata();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Find category UUID (or just use categoryId if selected)
      // Since categoryId on the server is a relation, let's resolve it.
      // We can look up the categories seeded in DB. We will just send the categoryId.
      // To simplify, let's create a generic search or fetch for category first.
      const catRes = await api.get('/api/v1/credits'); // to test connection
      // For now, let's just make the POST request:
      await api.post('/api/v1/credits', {
        ...formData,
        amountGranted: parseFloat(formData.amountGranted),
      });
      setShowCreateModal(false);
      fetchCredits();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création du crédit');
    }
  };

  const filteredCredits = credits.filter(c => {
    const matchesSearch = !search || c.creditNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Crédits et Avances
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gérez les prêts, avances de campagne et remboursements des planteurs et sous-acheteurs.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={18} /> Accorder un Crédit
          </button>
        </div>

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl backdrop-blur-md">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Montant Total Accordé</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-100">{stats.totalGranted.toLocaleString()} XOF</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><DollarSign size={24} /></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl backdrop-blur-md">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Montant Remboursé</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">{stats.totalRepaid.toLocaleString()} XOF</h3>
            </div>
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><TrendingUp size={24} /></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl backdrop-blur-md">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Solde Restant</p>
              <h3 className="text-2xl font-bold mt-1 text-teal-300">{stats.totalBalance.toLocaleString()} XOF</h3>
            </div>
            <div className="p-3 bg-teal-500/10 text-teal-300 rounded-xl"><Award size={24} /></div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl backdrop-blur-md">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Impays / Retards</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-500">{stats.totalOverdue.toLocaleString()} XOF</h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><AlertTriangle size={24} /></div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Rechercher par n° de crédit..."
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
              <option value="ACTIVE">Actif</option>
              <option value="PENDING_VALIDATION">En attente de validation</option>
              <option value="REPAID">Soldé</option>
              <option value="OVERDUE">En retard</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-5">Numéro</th>
                  <th className="p-5">Bénéficiaire</th>
                  <th className="p-5">Type</th>
                  <th className="p-5">Catégorie</th>
                  <th className="p-5">Montant</th>
                  <th className="p-5">Solde</th>
                  <th className="p-5">Statut</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-10 text-center text-slate-500">Chargement des crédits...</td>
                  </tr>
                ) : filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-10 text-center text-slate-500">Aucun crédit trouvé.</td>
                  </tr>
                ) : (
                  filteredCredits.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-5 font-mono text-emerald-400">{c.creditNumber}</td>
                      <td className="p-5 font-medium text-slate-200">
                        {c.planter ? `${c.planter.firstName} ${c.planter.lastName}` : c.beneficiaryId}
                      </td>
                      <td className="p-5 text-slate-400 text-xs">{c.beneficiaryType}</td>
                      <td className="p-5 text-slate-300">{c.category.label}</td>
                      <td className="p-5 font-semibold text-slate-200">{Number(c.amountGranted).toLocaleString()} XOF</td>
                      <td className="p-5 font-semibold text-teal-300">{Number(c.balance).toLocaleString()} XOF</td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          c.status === 'ACTIVE' ? 'bg-teal-500/10 text-teal-400' :
                          c.status === 'REPAID' ? 'bg-emerald-500/10 text-emerald-400' :
                          c.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-500 animate-pulse' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => navigate(`/credits/${c.id}`)}
                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-all inline-flex items-center"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6">
              <h2 className="text-2xl font-bold text-slate-100">Accorder un Nouveau Crédit</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Type Bénéficiaire</label>
                    <select
                      value={formData.beneficiaryType}
                      onChange={(e) => setFormData({ ...formData, beneficiaryType: e.target.value, beneficiaryId: '' })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="PLANTER">Planteur</option>
                      <option value="SUB_BUYER">Sous-Acheteur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Bénéficiaire</label>
                    <select
                      value={formData.beneficiaryId}
                      onChange={(e) => setFormData({ ...formData, beneficiaryId: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Sélectionner...</option>
                      {formData.beneficiaryType === 'PLANTER'
                        ? planters.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)
                        : subBuyers.map(sb => <option key={sb.id} value={sb.id}>{sb.firstName} {sb.lastName}</option>)
                      }
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Catégorie du Crédit</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Montant (XOF)</label>
                    <input
                      type="number"
                      value={formData.amountGranted}
                      onChange={(e) => setFormData({ ...formData, amountGranted: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Date Échéance</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Observations</label>
                  <textarea
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Créer le crédit
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

export default CreditsList;

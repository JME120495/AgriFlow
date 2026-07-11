import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, SlidersHorizontal, Eye, FileText, CheckCircle2, ShieldAlert, XCircle, LogOut, ArrowRight, Sparkles, Plus, TrendingDown, DollarSign, Award } from 'lucide-react';

const MOCK_SUB_BUYERS = [
  {
    id: 'sb1',
    firstName: 'Kouassi',
    lastName: 'Yao',
    phone: '+2250707070799',
    status: 'ACTIVE',
    store: 'Magasin Régional Abengourou',
    manager: 'Mamadou Diallo',
    profile: {
      id: 'prof1',
      purchaseZone: 'Zone Est Soubré',
      region: 'La Nawa',
      department: 'Soubré',
      mainVillage: 'Kpéhiri',
      creditLimit: 5000000.0,
      collaborationStartDate: '2025-04-01'
    },
    metrics: {
      currentBalance: 750000,
      totalAdvances: 5000000,
      totalUnjustified: 750000,
      purchasedMonth: 12400,
      performanceScore: 94
    }
  },
  {
    id: 'sb2',
    firstName: 'Koffi',
    lastName: 'Mathieu',
    phone: '+2250707070810',
    status: 'SUSPENDED',
    store: 'Magasin Régional Soubré',
    manager: 'Mamadou Diallo',
    profile: {
      id: 'prof2',
      purchaseZone: 'Zone Soubré Ouest',
      region: 'La Nawa',
      department: 'Soubré',
      mainVillage: 'Gnakouri',
      creditLimit: 4000000.0,
      collaborationStartDate: '2025-09-01'
    },
    metrics: {
      currentBalance: 3900000,
      totalAdvances: 4000000,
      totalUnjustified: 3900000,
      purchasedMonth: 2100,
      performanceScore: 42
    }
  }
];

const SubBuyersList = () => {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();

  const [subBuyers, setSubBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States de filtrage
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Formulaire de création
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: 'Password123!',
    gender: 'M',
    birthDate: '1990-01-01',
    idType: 'CNI',
    idNumber: '',
    idExpiryDate: '2030-12-31',
    purchaseZone: '',
    region: 'La Nawa',
    department: 'Soubré',
    arrondissement: 'Soubré',
    mainVillage: '',
    creditLimit: 5000000,
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSubBuyers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/sub-buyers', { params });
      
      // Pull stats for each sub-buyer to display complete metrics
      const list = res.data || [];
      const enriched = await Promise.all(list.map(async (sb) => {
        try {
          const statsRes = await api.get(`/sub-buyers/${sb.id}/stats`);
          return { ...sb, metrics: statsRes.data };
        } catch {
          return { ...sb, metrics: sb.metrics || { currentBalance: 0, totalAdvances: 0, purchasedMonth: 0, performanceScore: 80 } };
        }
      }));

      setSubBuyers(enriched.length > 0 ? enriched : MOCK_SUB_BUYERS);
    } catch (err) {
      console.warn('[SYS] Échec chargement API backend, utilisation du mock pour les sous-acheteurs.');
      const filtered = MOCK_SUB_BUYERS.filter(sb => {
        const matchesSearch = !search || `${sb.firstName} ${sb.lastName} ${sb.phone} ${sb.profile.purchaseZone}`.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || sb.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
      setSubBuyers(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubBuyers();
  }, [search, statusFilter]);

  const handleRowClick = (id) => {
    navigate(`/sub-buyers/${id}`);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/sub-buyers', formData);
      setIsModalOpen(false);
      fetchSubBuyers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la création du sous-acheteur.');
    }
  };

  const getRoleBadge = () => {
    return authUser?.role?.name || 'Collaborateur';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col selection:bg-cocoa-500/30">
      {/* Navbar Premium */}
      <header className="px-8 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-600 to-amber-800 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AgriFlow <span className="text-amber-400 font-medium">ERP</span></span>
          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {getRoleBadge()}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-400">
            <Link to="/dashboard" className="px-3 py-1.5 hover:text-white transition-colors">Tableau de bord</Link>
            <Link to="/planters" className="px-3 py-1.5 hover:text-white transition-colors">Planteurs</Link>
            <Link to="/sub-buyers" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Sous-acheteurs</Link>
            {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR') && (
              <>
                <Link to="/admin/users" className="px-3 py-1.5 hover:text-white transition-colors">Collaborateurs</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                {authUser?.firstName?.[0] || 'U'}{authUser?.lastName?.[0] || 'S'}
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-slate-200">
                {authUser?.firstName || 'Utilisateur'}
              </span>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Registre des Sous-acheteurs</h1>
            <p className="text-slate-400 text-sm mt-1">Supervisez vos collecteurs en brousse, allouez les avances de campagne et surveillez les écarts de livraison.</p>
          </div>
          {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'COMPTABLE') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-bold shadow-lg shadow-amber-600/10 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enregistrer un Sous-acheteur</span>
            </button>
          )}
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sous-acheteurs</p>
              <h3 className="text-2xl font-bold mt-1">{subBuyers.length}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encours Total Avances</p>
              <h3 className="text-2xl font-bold mt-1 text-red-400">
                {subBuyers.reduce((sum, sb) => sum + (sb.metrics?.currentBalance || 0), 0).toLocaleString()} FCFA
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Achat cumulé (mois)</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">
                {subBuyers.reduce((sum, sb) => sum + (sb.metrics?.purchasedMonth || 0), 0).toLocaleString()} Kg
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingDown className="w-6 h-6 rotate-180" />
            </div>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score Moyen Performance</p>
              <h3 className="text-2xl font-bold mt-1 text-indigo-400">
                {Math.round(subBuyers.reduce((sum, sb) => sum + (sb.metrics?.performanceScore || 80), 0) / (subBuyers.length || 1))}/100
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filtres et Barre de recherche */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-md shadow-black/10">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, zone d'achat, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
            />
          </div>

          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:w-48 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="DEACTIVATED">Inactif</option>
            </select>
          </div>
        </div>

        {/* Registre Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Collecteur (Pisteur)</th>
                  <th className="p-4">Zone d'Achat</th>
                  <th className="p-4">Rattachement</th>
                  <th className="p-4">Solde Avance</th>
                  <th className="p-4">Utilisation Plafond</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Chargement des dossiers sous-acheteurs...</td>
                  </tr>
                ) : subBuyers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Aucun sous-acheteur trouvé dans le registre.</td>
                  </tr>
                ) : (
                  subBuyers.map((sb) => {
                    const balance = sb.metrics?.currentBalance || 0;
                    const limit = sb.profile?.creditLimit || 5000000;
                    const ratio = (balance / limit) * 100;
                    const isLimitWarning = ratio >= 80;

                    return (
                      <tr
                        key={sb.id}
                        onClick={() => handleRowClick(sb.id)}
                        className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                      >
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-500 uppercase">
                            {sb.firstName[0]}{sb.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{sb.firstName} {sb.lastName}</p>
                            <p className="text-xs text-slate-400">{sb.phone || 'Pas de téléphone'}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">
                          {sb.profile?.purchaseZone || 'Non affectée'}
                          <span className="block text-xs text-slate-500">{sb.profile?.mainVillage || '-'}</span>
                        </td>
                        <td className="p-4 text-slate-300">
                          <p className="font-medium text-slate-200">{sb.store || 'Magasin Central'}</p>
                          <p className="text-xs text-slate-500">Resp: {sb.manager || 'N/A'}</p>
                        </td>
                        <td className="p-4 font-mono text-sm font-semibold text-slate-200">
                          {balance.toLocaleString()} FCFA
                        </td>
                        <td className="p-4">
                          <div className="w-32">
                            <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-400">
                              <span>{Math.round(ratio)}%</span>
                              <span>Plafond: {(limit / 1000000).toFixed(1)}M</span>
                            </div>
                            <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isLimitWarning ? 'bg-red-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, ratio)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            sb.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : sb.status === 'SUSPENDED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {sb.status === 'ACTIVE' ? 'Actif' : sb.status === 'SUSPENDED' ? 'Suspendu' : 'Inactif'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Création Sous-Acheteur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold mb-1">Enregistrer un nouveau sous-acheteur</h2>
            <p className="text-slate-400 text-sm mb-6">Créez le profil d'un collecteur terrain et configurez son plafond financier.</p>

            {errorMsg && (
              <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Nom</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Prénom</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Téléphone Principal</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Plafond d'Avance (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Zone d'Achat</label>
                  <input
                    type="text"
                    required
                    value={formData.purchaseZone}
                    onChange={(e) => setFormData({ ...formData, purchaseZone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-white text-sm"
                    placeholder="Ex: Zone Est Soubré"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Village Principal</label>
                  <input
                    type="text"
                    required
                    value={formData.mainVillage}
                    onChange={(e) => setFormData({ ...formData, mainVillage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-white text-sm"
                    placeholder="Ex: Kpéhiri"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Type de Pièce</label>
                  <select
                    value={formData.idType}
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-white text-sm"
                  >
                    <option value="CNI">CNI</option>
                    <option value="PASSPORT">Passeport</option>
                    <option value="CARTE_CONSEIL">Carte Conseil</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Numéro de la Pièce</label>
                  <input
                    type="text"
                    required
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-800 hover:bg-slate-850 rounded-xl text-sm font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubBuyersList;

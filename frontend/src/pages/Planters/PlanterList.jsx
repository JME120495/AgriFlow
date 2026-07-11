import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, SlidersHorizontal, Eye, FileText, CheckCircle2, ShieldAlert, XCircle, LogOut, ArrowRight, Sparkles } from 'lucide-react';

const MOCK_PLANTERS = [
  { id: 'p1', code: 'PL-2026-0001', firstName: 'Alassane', lastName: 'Ouattara', phone: '+2250707070701', status: 'ACTIVE', store: { name: 'Magasin Régional Abengourou' }, plantation: { location: 'Village Abron', areaHectares: 12.5 }, createdAt: '2026-06-15T08:00:00Z' },
  { id: 'p2', code: 'PL-2026-0002', firstName: 'Koffi', lastName: 'Kouamé', phone: '+2250707070702', status: 'ACTIVE', store: { name: 'Magasin Régional Abengourou' }, plantation: { location: 'Campement Yao', areaHectares: 8.2 }, createdAt: '2026-07-01T10:30:00Z' },
  { id: 'p3', code: 'PL-2026-0003', firstName: 'Didier', lastName: 'Drogba', phone: '+2250707070703', status: 'SUSPENDED', store: { name: 'Magasin Régional Soubré' }, plantation: { location: 'Basse-Sassandra', areaHectares: 15.0 }, createdAt: '2026-05-10T14:15:00Z' },
];

const PlanterList = () => {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();

  const [planters, setPlanters] = useState(MOCK_PLANTERS);
  const [total, setTotal] = useState(MOCK_PLANTERS.length);
  const [loading, setLoading] = useState(false);

  // States de filtrage
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPlanters = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (storeFilter) params.storeId = storeFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/planters', { params });
      setPlanters(res.data.planters || MOCK_PLANTERS);
      setTotal(res.data.total || MOCK_PLANTERS.length);
    } catch (err) {
      console.warn('[SYS] Échec chargement API backend, utilisation du mock pour les planteurs.');
      // Filtrage local en cas de mock
      const filtered = MOCK_PLANTERS.filter(p => {
        const matchesSearch = !search || `${p.firstName} ${p.lastName} ${p.code} ${p.phone} ${p.plantation.location}`.toLowerCase().includes(search.toLowerCase());
        const matchesStore = !storeFilter || (storeFilter === 'store2' && p.store.name.includes('Abengourou')) || (storeFilter === 'store3' && p.store.name.includes('Soubré'));
        const matchesStatus = !statusFilter || p.status === statusFilter;
        return matchesSearch && matchesStore && matchesStatus;
      });
      setPlanters(filtered);
      setTotal(filtered.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanters();
  }, [search, storeFilter, statusFilter]);

  const handleRowClick = (id) => {
    navigate(`/planters/${id}`);
  };

  const getRoleBadge = () => {
    return authUser?.role?.name || 'Collaborateur';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col selection:bg-cocoa-500/30">
      {/* Navbar Premium */}
      <header className="px-8 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cocoa-500 to-cocoa-700 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AgriFlow <span className="text-cocoa-400 font-medium">ERP</span></span>
          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {getRoleBadge()}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-400">
            <Link to="/dashboard" className="px-3 py-1.5 hover:text-white transition-colors">Tableau de bord</Link>
            <Link to="/planters" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Planteurs</Link>
            {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR') && (
              <>
                <Link to="/admin/users" className="px-3 py-1.5 hover:text-white transition-colors">Collaborateurs</Link>
                <Link to="/admin/permissions" className="px-3 py-1.5 hover:text-white transition-colors">Permissions</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cocoa-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
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
            <h1 className="text-3xl font-extrabold tracking-tight">Gestion des Planteurs</h1>
            <p className="text-slate-400 text-sm mt-1">Gérez le registre des planteurs, leurs plantations agricoles, leurs crédits et leurs historiques de ventes.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/planters/new" className="flex items-center gap-2 px-4 py-2 bg-cocoa-600 hover:bg-cocoa-500 rounded-xl text-sm font-bold shadow-lg shadow-cocoa-600/10 transition-colors">
              <UserPlus className="w-4 h-4" />
              <span>Enregistrer un Planteur</span>
            </Link>
          </div>
        </div>

        {/* Filtres et Barre de recherche */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-md shadow-black/10">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, code, téléphone, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:border-cocoa-500 transition-colors text-sm"
            />
          </div>

          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="flex-1 md:w-48 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-cocoa-500 transition-colors"
            >
              <option value="">Tous les magasins</option>
              <option value="store2">Abengourou</option>
              <option value="store3">Soubré</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:w-40 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-cocoa-500 transition-colors"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="DEACTIVATED">Inactif</option>
            </select>
          </div>
        </div>

        {/* Table Registre Planteurs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Planteur</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Localisation Plantation</th>
                  <th className="p-4">Superficie</th>
                  <th className="p-4">Centre de Collecte</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Chargement des dossiers planteurs...</td>
                  </tr>
                ) : planters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">Aucun planteur trouvé dans le registre.</td>
                  </tr>
                ) : (
                  planters.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => handleRowClick(p.id)}
                      className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                    >
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cocoa-400 uppercase">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-slate-400">{p.phone || 'Pas de téléphone'}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-cocoa-300 font-semibold">
                        {p.code}
                      </td>
                      <td className="p-4 text-slate-300">
                        {p.plantation?.location || 'Non renseigné'}
                      </td>
                      <td className="p-4 text-slate-300 font-bold">
                        {p.plantation?.areaHectares ? `${p.plantation.areaHectares} ha` : '-'}
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {p.store?.name || 'Non rattaché'}
                      </td>
                      <td className="p-4">
                        {p.status === 'ACTIVE' ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4" /> Actif
                          </span>
                        ) : p.status === 'SUSPENDED' ? (
                          <span className="flex items-center gap-1.5 text-yellow-500 text-xs font-semibold">
                            <ShieldAlert className="w-4 h-4" /> Suspendu
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-500 text-xs font-semibold">
                            <XCircle className="w-4 h-4" /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/planters/${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 hover:text-white rounded-lg transition-colors border border-slate-700/80"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Fiche</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
            <span>Total : {total} planteur(s) enregistré(s)</span>
            <span>Campagne Cacao 2026</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlanterList;

import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Layers, Search, Eye, Filter, RefreshCw, ChevronLeft, Boxes,
  AlertTriangle, LogOut, ArrowUpDown, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const MOCK_LOTS = [
  { id: 'l1', numeroLot: 'LOT-2026-07-001', campagne: '2025/2026', qualite: 'GRADE_1', poidsInitial: 4500, poidsActuel: 4500, nombreSacs: 70, status: 'DISPONIBLE', emplacement: { code: 'LOC-A-01' } },
  { id: 'l2', numeroLot: 'LOT-2026-07-002', campagne: '2025/2026', qualite: 'GRADE_2', poidsInitial: 3000, poidsActuel: 3000, nombreSacs: 45, status: 'DISPONIBLE', emplacement: { code: 'LOC-A-05' } },
  { id: 'l3', numeroLot: 'LOT-2026-07-003', campagne: '2025/2026', qualite: 'GRADE_1', poidsInitial: 3200, poidsActuel: 3200, nombreSacs: 50, status: 'RESERVE', emplacement: { code: 'LOC-A-02' } },
  { id: 'l4', numeroLot: 'LOT-2026-07-004', campagne: '2025/2026', qualite: 'GRADE_2', poidsInitial: 1200, poidsActuel: 1200, nombreSacs: 18, status: 'BLOQUE', emplacement: { code: 'LOC-A-03' } }
];

const GRADE_LABELS = { GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', SOUS_GRADE: 'Sous-Grade' };
const GRADE_COLORS = {
  GRADE_1: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  GRADE_2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SOUS_GRADE: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
};

const STATUS_MAP = {
  DISPONIBLE: { label: 'Disponible', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  RESERVE: { label: 'Réservé', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  EXPEDIE: { label: 'Expédié', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  BLOQUE: { label: 'Bloqué', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
};

export default function LotsList() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterQuality, setFilterQuality] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');

  useEffect(() => {
    fetchLots();
  }, [search, filterStatus, filterQuality, filterCampaign]);

  const fetchLots = async () => {
    setLoading(true);
    try {
      if (USE_MOCKS) {
        let filtered = [...MOCK_LOTS];
        if (search) filtered = filtered.filter(l => l.numeroLot.toLowerCase().includes(search.toLowerCase()));
        if (filterStatus) filtered = filtered.filter(l => l.status === filterStatus);
        if (filterQuality) filtered = filtered.filter(l => l.qualite === filterQuality);
        if (filterCampaign) filtered = filtered.filter(l => l.campagne === filterCampaign);
        setLots(filtered);
      } else {
        const params = {
          search,
          status: filterStatus || undefined,
          qualite: filterQuality || undefined,
          campagne: filterCampaign || undefined
        };
        const res = await api.get('/api/v1/stocks/lots', { params });
        setLots(res.data.items);
      }
    } catch (err) {
      toast.error("Erreur lors de la récupération des lots");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => n?.toLocaleString('fr-FR') || '0';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cocoa-600 to-amber-600 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AgriFlow <span className="text-cocoa-400 font-medium">ERP</span></span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-400">
            <Link to="/dashboard" className="px-3 py-1.5 hover:text-white transition-colors">Tableau de bord</Link>
            <Link to="/stocks" className="px-3 py-1.5 hover:text-white transition-colors">Stocks</Link>
            <Link to="/stocks/lots" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Lots</Link>
          </nav>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cocoa-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              {authUser?.firstName?.[0] || 'U'}{authUser?.lastName?.[0] || 'S'}
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors" title="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-fade">
        {/* Navigation & Header */}
        <div>
          <button onClick={() => navigate('/stocks')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" /> Retour au tableau de bord des stocks
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Tag className="w-6 h-6 text-cocoa-400" /> Registre Général des Lots
          </h1>
          <p className="text-sm text-slate-400">Liste complète de tous les lots de cacao stockés dans les entrepôts</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="N° de lot..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-cocoa-500"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cocoa-500"
            >
              <option value="">Tous les statuts</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="RESERVE">Réservé</option>
              <option value="EXPEDIE">Expédié</option>
              <option value="BLOQUE">Bloqué</option>
            </select>
          </div>

          <div>
            <select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cocoa-500"
            >
              <option value="">Toutes les qualités</option>
              <option value="GRADE_1">Grade 1</option>
              <option value="GRADE_2">Grade 2</option>
              <option value="SOUS_GRADE">Sous-Grade</option>
            </select>
          </div>

          <div>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cocoa-500"
            >
              <option value="">Toutes les campagnes</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>
        </div>

        {/* Lots Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-3 text-cocoa-400" /> Récupération du registre...
          </div>
        ) : lots.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-850 rounded-2xl text-slate-500">
            Aucun lot trouvé correspondant à vos critères.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-800 bg-slate-850/50">
                    <th className="p-4 text-left">N° de Lot</th>
                    <th className="p-4 text-left">Campagne</th>
                    <th className="p-4 text-left">Qualité</th>
                    <th className="p-4 text-right">Poids (Initial / Actuel)</th>
                    <th className="p-4 text-right">Nombre Sacs</th>
                    <th className="p-4 text-left">Emplacement</th>
                    <th className="p-4 text-left">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => {
                    const st = STATUS_MAP[lot.status] || STATUS_MAP.DISPONIBLE;
                    return (
                      <tr key={lot.id} className="border-b border-slate-800/50 hover:bg-slate-850/20 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-200">{lot.numeroLot}</td>
                        <td className="p-4 text-slate-400">{lot.campagne}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${GRADE_COLORS[lot.qualite]}`}>
                            {GRADE_LABELS[lot.qualite] || lot.qualite}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-300">
                          {fmt(lot.poidsInitial)} kg / <span className="text-emerald-400">{fmt(lot.poidsActuel)} kg</span>
                        </td>
                        <td className="p-4 text-right">{lot.nombreSacs}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{lot.emplacement?.code || '—'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => navigate(`/stocks/lots/${lot.id}`)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-cocoa-500/20 text-slate-300 hover:text-cocoa-400 transition-all inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" /> Détail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

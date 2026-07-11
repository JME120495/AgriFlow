import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes, Package, BarChart3, TrendingUp, RefreshCw, AlertTriangle, LogOut,
  Layers, CreditCard, ChevronRight, Activity, Sparkles, HelpCircle, ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const MOCK_STATS = {
  totalLots: 4,
  totalWeightKg: 11900,
  totalWeightTonnes: 11.9,
  totalBags: 183,
  totalValueFCFA: 17745000,
  cumpFCFA: 1491,
  statsByStore: [
    { name: 'Magasin Régional Abengourou', weight: 11900, value: 17745000 }
  ],
  statsByQuality: {
    GRADE_1: { weight: 7700, value: 11550000 },
    GRADE_2: { weight: 4200, value: 6195000 }
  },
  statsByCampaign: {
    '2025/2026': { weight: 11900, value: 17745000 }
  },
  alerts: [
    { type: 'LOW_STOCK', severity: 'WARNING', message: 'Le stock théorique du magasin "Magasin Régional Abengourou" est bas (11.9 T).' },
    { type: 'BLOCKED_LOT', severity: 'CRITICAL', message: 'Le lot "LOT-2026-07-004" est bloqué (qualité non conforme).' }
  ]
};

const COLORS = ['#d97706', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e'];

export default function StocksDashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (USE_MOCKS) {
        setStats(MOCK_STATS);
      } else {
        const res = await api.get('/api/v1/stocks/stats');
        setStats(res.data);
      }
    } catch (err) {
      toast.error("Erreur lors du chargement des statistiques de stock");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => n?.toLocaleString('fr-FR') || '0';
  const fmtDec = (n) => n?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-cocoa-400" /> Chargement des données...
      </div>
    );
  }

  // Adapter les données pour le camembert de qualité
  const pieData = stats ? Object.keys(stats.statsByQuality).map((k) => ({
    name: k === 'GRADE_1' ? 'Grade 1' : k === 'GRADE_2' ? 'Grade 2' : 'Sous-Grade',
    value: stats.statsByQuality[k].weight
  })) : [];

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
            <Link to="/warehouses" className="px-3 py-1.5 hover:text-white transition-colors">Magasins</Link>
            <Link to="/stocks" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Stocks</Link>
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
        {/* Entête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-cocoa-500/10 rounded-xl"><Boxes className="w-7 h-7 text-cocoa-400" /></div>
              Suivi et Valorisation des Stocks
            </h1>
            <p className="mt-1 text-slate-400">Analyse financière, traçabilité des lots et alertes opérationnelles</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchStats} className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors" title="Rafraîchir">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/stocks/lots')} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cocoa-600 to-amber-600 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-cocoa-500/20 transition-all">
              <Layers className="w-4 h-4" /> Consulter les Lots
            </button>
          </div>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cocoa-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cocoa-500/10 rounded-lg"><Boxes className="w-5 h-5 text-cocoa-400" /></div>
                <span className="text-sm text-slate-400 font-medium">Lots Actifs</span>
              </div>
              <div className="text-3xl font-bold">{stats.totalLots}</div>
              <div className="text-xs text-slate-500 mt-1">Lots physiques disponibles</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Package className="w-5 h-5 text-blue-400" /></div>
                <span className="text-sm text-slate-400 font-medium">Quantité Totale</span>
              </div>
              <div className="text-3xl font-bold">{fmtDec(stats.totalWeightTonnes)} <span className="text-sm text-slate-400 font-normal">T</span></div>
              <div className="text-xs text-slate-500 mt-1">{fmt(stats.totalBags)} sacs de jute</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><CreditCard className="w-5 h-5 text-emerald-400" /></div>
                <span className="text-sm text-slate-400 font-medium">Valeur du Stock</span>
              </div>
              <div className="text-2xl font-bold tracking-tight">{fmt(stats.totalValueFCFA)} <span className="text-xs text-emerald-400 font-mono">FCFA</span></div>
              <div className="text-xs text-slate-500 mt-1">Valorisation au coût d'achat</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-400" /></div>
                <span className="text-sm text-slate-400 font-medium">Coût Moyen Pondéré</span>
              </div>
              <div className="text-3xl font-bold">{fmt(stats.cumpFCFA)} <span className="text-sm text-slate-400 font-normal">/ kg</span></div>
              <div className="text-xs text-slate-500 mt-1">CMUP global calculé</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-black/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-500/10 rounded-lg"><Activity className="w-5 h-5 text-violet-400" /></div>
                <span className="text-sm text-slate-400 font-medium">Campagne</span>
              </div>
              <div className="text-3xl font-bold">2025/2026</div>
              <div className="text-xs text-slate-500 mt-1">Campagne active</div>
            </div>
          </div>
        )}

        {/* Alerts & Critical states */}
        {stats && stats.alerts && stats.alerts.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Alertes et Anomalies de Stock
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats.alerts.map((alt, index) => (
                <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border ${
                  alt.severity === 'CRITICAL' 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${alt.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`} />
                  <div>
                    <span className="text-xs font-semibold uppercase block text-slate-400 mb-0.5">
                      {alt.type === 'LOW_STOCK' ? 'Seuil critique bas' : 'Lot Bloqué'}
                    </span>
                    <p className="text-sm font-medium">{alt.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Distribution par qualité */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/10 flex flex-col">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cocoa-400" /> Répartition par Qualité
              </h3>
              <div className="h-64 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${fmt(value)} kg`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Répartition par Magasin */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/10 col-span-2 flex flex-col">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" /> Stock par Magasin
              </h3>
              <div className="h-64 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.statsByStore}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip formatter={(value) => `${fmt(value)} kg`} />
                    <Legend />
                    <Bar dataKey="weight" name="Poids (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

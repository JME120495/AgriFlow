import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Warehouse, MapPin, Package, TrendingUp, BarChart3, Plus, Search, Eye,
  RefreshCw, AlertTriangle, CheckCircle2, LogOut, ArrowUpDown, Boxes, Layers,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const MOCK_STORES = [
  {
    id: '1', code: 'MAG-01', name: 'Magasin Central Douala', location: 'Douala',
    type: 'STOCKAGE', status: 'ACTIVE', capacityKg: 100000, city: 'Douala', region: 'Littoral',
    responsible: { firstName: 'Marcel', lastName: 'Ndongo' },
    warehouses: [], _count: { purchases: 45, detailedStockMovements: 128, inventories: 3 },
    metrics: { currentWeightKg: 62450, currentWeightTonnes: 62.45, currentBags: 962, occupancyRate: 62.5, warehouseCount: 2, locationCount: 8 },
  },
  {
    id: '2', code: 'MAG-02', name: 'Magasin Régional Abengourou', location: 'Abengourou',
    type: 'COLLECTE', status: 'ACTIVE', capacityKg: 50000, city: 'Abengourou', region: 'Comoé',
    responsible: { firstName: 'Kouadio', lastName: 'Yao' },
    warehouses: [], _count: { purchases: 22, detailedStockMovements: 67, inventories: 1 },
    metrics: { currentWeightKg: 31200, currentWeightTonnes: 31.20, currentBags: 481, occupancyRate: 62.4, warehouseCount: 1, locationCount: 4 },
  },
  {
    id: '3', code: 'MAG-03', name: 'Entrepôt Export San Pedro', location: 'San Pedro',
    type: 'EXPORT', status: 'ACTIVE', capacityKg: 200000, city: 'San Pedro', region: 'Bas-Sassandra',
    responsible: { firstName: 'Seydou', lastName: 'Coulibaly' },
    warehouses: [], _count: { purchases: 5, detailedStockMovements: 89, inventories: 2 },
    metrics: { currentWeightKg: 145000, currentWeightTonnes: 145.00, currentBags: 2231, occupancyRate: 72.5, warehouseCount: 3, locationCount: 12 },
  },
];

const MOCK_STATS = {
  totalStores: 3, totalWarehouses: 6, totalLocations: 24,
  totalCapacityKg: 350000, totalCapacityTonnes: 350.00,
  totalCurrentKg: 238650, totalCurrentTonnes: 238.65,
  totalBags: 3674, globalOccupancy: 68.2,
  movementsToday: 12, pendingInventories: 1,
};

const TYPE_LABELS = { COLLECTE: 'Collecte', STOCKAGE: 'Stockage', TRANSIT: 'Transit', EXPORT: 'Export' };
const STATUS_MAP = {
  ACTIVE: { label: 'Actif', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  CLOSED: { label: 'Fermé', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

function getOccupancyColor(rate) {
  if (rate >= 90) return 'bg-red-500';
  if (rate >= 75) return 'bg-amber-500';
  if (rate >= 50) return 'bg-emerald-500';
  return 'bg-blue-500';
}

function getOccupancyTextColor(rate) {
  if (rate >= 90) return 'text-red-400';
  if (rate >= 75) return 'text-amber-400';
  if (rate >= 50) return 'text-emerald-400';
  return 'text-blue-400';
}

export default function WarehousesList() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (USE_MOCKS) {
        const filtered = search
          ? MOCK_STORES.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.city?.toLowerCase().includes(search.toLowerCase()))
          : MOCK_STORES;
        setStores(filtered);
        setStats(MOCK_STATS);
      } else {
        const [storesRes, statsRes] = await Promise.all([
          api.get('/api/v1/warehouses/stores', { params: { search } }),
          api.get('/api/v1/warehouses/stats'),
        ]);
        setStores(storesRes.data);
        setStats(statsRes.data);
      }
    } catch (err) {
      toast.error('Erreur de chargement des magasins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => n?.toLocaleString('fr-FR') || '0';
  const fmtDec = (n) => n?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cocoa-600 to-amber-600 flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AgriFlow <span className="text-cocoa-400 font-medium">ERP</span></span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-400">
            <Link to="/dashboard" className="px-3 py-1.5 hover:text-white transition-colors">Tableau de bord</Link>
            <Link to="/planters" className="px-3 py-1.5 hover:text-white transition-colors">Planteurs</Link>
            <Link to="/purchases" className="px-3 py-1.5 hover:text-white transition-colors">Achats</Link>
            <Link to="/quality-controls" className="px-3 py-1.5 hover:text-white transition-colors">Qualité</Link>
            <Link to="/warehouses" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Magasins</Link>
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

        {/* Page Title + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl"><Warehouse className="w-7 h-7 text-amber-400" /></div>
              Gestion des Magasins & Entrepôts
            </h1>
            <p className="mt-1 text-slate-400">Suivi des capacités, mouvements de stock et inventaires</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors" title="Rafraîchir">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/warehouses/movements')} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors font-medium text-sm flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" /> Mouvements
            </button>
            <button onClick={() => navigate('/warehouses/inventories')} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors font-medium text-sm flex items-center gap-2">
              <Boxes className="w-4 h-4" /> Inventaires
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Warehouse className="w-5 h-5 text-blue-400" /></div>
                <span className="text-sm text-slate-400">Magasins</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalStores}</div>
              <div className="text-xs text-slate-500 mt-1">{stats.totalWarehouses} entrepôts · {stats.totalLocations} emplacements</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><Package className="w-5 h-5 text-emerald-400" /></div>
                <span className="text-sm text-slate-400">Stock Total</span>
              </div>
              <div className="text-2xl font-bold">{fmtDec(stats.totalCurrentTonnes)} <span className="text-sm text-slate-400 font-normal">tonnes</span></div>
              <div className="text-xs text-slate-500 mt-1">{fmt(stats.totalBags)} sacs</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-500/10 rounded-lg"><BarChart3 className="w-5 h-5 text-amber-400" /></div>
                <span className="text-sm text-slate-400">Taux d'Occupation</span>
              </div>
              <div className={`text-2xl font-bold ${getOccupancyTextColor(stats.globalOccupancy)}`}>{stats.globalOccupancy}%</div>
              <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${getOccupancyColor(stats.globalOccupancy)}`} style={{ width: `${Math.min(100, stats.globalOccupancy)}%` }}></div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-500/10 rounded-lg"><Activity className="w-5 h-5 text-violet-400" /></div>
                <span className="text-sm text-slate-400">Activité du jour</span>
              </div>
              <div className="text-2xl font-bold">{fmt(stats.movementsToday)}</div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.pendingInventories > 0 && (
                  <span className="text-amber-400">⚠ {stats.pendingInventories} inventaire(s) en attente</span>
                )}
                {stats.pendingInventories === 0 && 'mouvements enregistrés'}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text" placeholder="Rechercher par nom, ville..."
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cocoa-500/40"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Chargement...
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-20 text-slate-500">Aucun magasin trouvé.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stores.map((store) => {
              const m = store.metrics || {};
              const statusConf = STATUS_MAP[store.status] || STATUS_MAP.ACTIVE;
              return (
                <div
                  key={store.id}
                  onClick={() => navigate(`/warehouses/${store.id}`)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-cocoa-500/40 hover:shadow-lg hover:shadow-cocoa-500/5 transition-all cursor-pointer group"
                >
                  {/* Store Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{store.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConf.color}`}>{statusConf.label}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cocoa-400 transition-colors">{store.name}</h3>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-cocoa-500/10 transition-colors">
                      <Eye className="w-4 h-4 text-slate-400 group-hover:text-cocoa-400" />
                    </div>
                  </div>

                  {/* Location & Type */}
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-5">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{store.city || store.location || '—'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-medium">{TYPE_LABELS[store.type] || store.type}</span>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-400">Occupation</span>
                      <span className={`font-bold ${getOccupancyTextColor(m.occupancyRate || 0)}`}>{m.occupancyRate || 0}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${getOccupancyColor(m.occupancyRate || 0)}`} style={{ width: `${Math.min(100, m.occupancyRate || 0)}%` }}></div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-800/50 rounded-lg p-2.5">
                      <div className="text-sm font-bold">{fmtDec(m.currentWeightTonnes || 0)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Tonnes</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2.5">
                      <div className="text-sm font-bold">{fmt(m.currentBags || 0)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Sacs</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2.5">
                      <div className="text-sm font-bold">{m.warehouseCount || 0}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Entrepôts</div>
                    </div>
                  </div>

                  {/* Responsible */}
                  {store.responsible && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cocoa-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                        {store.responsible.firstName?.[0]}{store.responsible.lastName?.[0]}
                      </div>
                      Responsable: {store.responsible.firstName} {store.responsible.lastName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}

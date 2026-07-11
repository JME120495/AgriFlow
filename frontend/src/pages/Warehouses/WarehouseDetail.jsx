import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Warehouse, MapPin, Package, ChevronLeft, ArrowUpDown, Boxes, Layers,
  RefreshCw, Plus, Eye, CheckCircle2, AlertTriangle, LogOut, Activity,
  BarChart3, ArrowDown, ArrowUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const MOCK_STORE = {
  id: '1', code: 'MAG-01', name: 'Magasin Central Douala', location: 'Douala',
  type: 'STOCKAGE', status: 'ACTIVE', capacityKg: 100000, city: 'Douala', region: 'Littoral',
  phone: '+225 27 20 12 34 56', address: 'Zone Industrielle, Douala',
  responsible: { firstName: 'Marcel', lastName: 'Ndongo', email: 'marcel@agriflow.ci', phone: '+225 07 08 09 10' },
  warehouses: [
    {
      id: 'wh1', name: 'Entrepôt Principal', capacityTonnes: 60,
      storageZones: [
        {
          id: 'z1', name: 'Zone A – Grade 1', cocoaGrade: 'GRADE_1',
          locations: [
            { id: 'l1', code: 'LOC-01-A-01', capacityKg: 5000, currentWeightKg: 3200, currentBags: 49 },
            { id: 'l2', code: 'LOC-01-A-02', capacityKg: 5000, currentWeightKg: 4100, currentBags: 63 },
            { id: 'l3', code: 'LOC-01-A-03', capacityKg: 5000, currentWeightKg: 800, currentBags: 12 },
          ],
        },
        {
          id: 'z2', name: 'Zone B – Grade 2', cocoaGrade: 'GRADE_2',
          locations: [
            { id: 'l4', code: 'LOC-01-B-01', capacityKg: 8000, currentWeightKg: 5600, currentBags: 86 },
            { id: 'l5', code: 'LOC-01-B-02', capacityKg: 8000, currentWeightKg: 7200, currentBags: 111 },
          ],
        },
      ],
    },
    {
      id: 'wh2', name: 'Entrepôt Annexe', capacityTonnes: 40,
      storageZones: [
        {
          id: 'z3', name: 'Zone C – Tout Grade', cocoaGrade: 'GRADE_2',
          locations: [
            { id: 'l6', code: 'LOC-02-C-01', capacityKg: 10000, currentWeightKg: 6500, currentBags: 100 },
            { id: 'l7', code: 'LOC-02-C-02', capacityKg: 10000, currentWeightKg: 3800, currentBags: 58 },
            { id: 'l8', code: 'LOC-02-C-03', capacityKg: 10000, currentWeightKg: 9200, currentBags: 142 },
          ],
        },
      ],
    },
  ],
  inventories: [
    { id: 'inv1', inventoryNumber: 'INV-202607-0001', status: 'APPROVED', startDate: '2026-07-01', endDate: '2026-07-01', createdBy: { firstName: 'Marcel', lastName: 'Ndongo' }, validatedBy: { firstName: 'Admin', lastName: 'System' } },
    { id: 'inv2', inventoryNumber: 'INV-202607-0002', status: 'PENDING_APPROVAL', startDate: '2026-07-10', endDate: null, createdBy: { firstName: 'Marcel', lastName: 'Ndongo' }, validatedBy: null },
  ],
  metrics: {
    currentWeightKg: 40400, currentWeightTonnes: 40.40, currentBags: 621,
    occupancyRate: 40.4, warehouseCount: 2, totalLocationCapacity: 61000,
  },
  recentMovements: [
    { id: 'm1', type: 'IN_PURCHASE', weightKg: 650, bagCount: 10, date: '2026-07-11T08:30:00Z', sourceLocation: null, destLocation: { code: 'LOC-01-A-01' }, createdBy: { firstName: 'Marcel', lastName: 'Ndongo' } },
    { id: 'm2', type: 'INTERNAL_TRANSFER', weightKg: 1200, bagCount: 18, date: '2026-07-11T10:15:00Z', sourceLocation: { code: 'LOC-01-B-02' }, destLocation: { code: 'LOC-02-C-01' }, createdBy: { firstName: 'Marcel', lastName: 'Ndongo' } },
    { id: 'm3', type: 'OUT_SALE', weightKg: 5000, bagCount: 77, date: '2026-07-10T16:00:00Z', sourceLocation: { code: 'LOC-02-C-03' }, destLocation: null, createdBy: { firstName: 'Seydou', lastName: 'Coulibaly' } },
    { id: 'm4', type: 'IN_PURCHASE', weightKg: 320, bagCount: 5, date: '2026-07-10T09:45:00Z', sourceLocation: null, destLocation: { code: 'LOC-01-A-03' }, createdBy: { firstName: 'Marcel', lastName: 'Ndongo' } },
  ],
};

const TYPE_LABELS = { IN_PURCHASE: 'Entrée Achat', OUT_SALE: 'Sortie Vente', INTERNAL_TRANSFER: 'Transfert Interne', INTER_STORE_TRANSFER: 'Transfert Inter-Magasin', INVENTORY_CORRECTION: 'Correction Inventaire' };
const TYPE_COLORS = {
  IN_PURCHASE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  OUT_SALE: 'bg-red-500/15 text-red-400 border-red-500/30',
  INTERNAL_TRANSFER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  INTER_STORE_TRANSFER: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  INVENTORY_CORRECTION: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const INV_STATUS = {
  DRAFT: { label: 'Brouillon', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  COUNTING: { label: 'Comptage', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  COMPLETED: { label: 'Terminé', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  PENDING_APPROVAL: { label: 'En attente', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  APPROVED: { label: 'Approuvé', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
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

export default function WarehouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('structure'); // structure | movements | inventories

  useEffect(() => { fetchStore(); }, [id]);

  const fetchStore = async () => {
    setLoading(true);
    try {
      if (USE_MOCKS) {
        setStore(MOCK_STORE);
      } else {
        const res = await api.get(`/api/v1/warehouses/stores/${id}`);
        setStore(res.data);
      }
    } catch (err) {
      toast.error('Erreur de chargement du magasin');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => n?.toLocaleString('fr-FR') || '0';
  const fmtDec = (n) => n?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-cocoa-400" /> Chargement...
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 mr-3 text-amber-400" /> Magasin introuvable.
      </div>
    );
  }

  const m = store.metrics || {};

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
        {/* Breadcrumb & Title */}
        <div>
          <button onClick={() => navigate('/warehouses')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" /> Retour aux magasins
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-cocoa-600 flex items-center justify-center shadow-lg">
              <Warehouse className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{store.name}</h1>
                <span className="text-xs font-mono text-slate-500">{store.code}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                {store.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{store.city}, {store.region}</span>}
                {store.responsible && <span>Responsable: {store.responsible.firstName} {store.responsible.lastName}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{fmtDec(m.currentWeightTonnes || 0)}</div>
            <div className="text-xs text-slate-400 mt-1">Tonnes en stock</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{fmt(m.currentBags || 0)}</div>
            <div className="text-xs text-slate-400 mt-1">Sacs</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${getOccupancyTextColor(m.occupancyRate || 0)}`}>{m.occupancyRate || 0}%</div>
            <div className="text-xs text-slate-400 mt-1">Taux Occupation</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{m.warehouseCount || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Entrepôts</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{fmt(store.capacityKg / 1000)}</div>
            <div className="text-xs text-slate-400 mt-1">Capacité (T)</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { key: 'structure', label: 'Structure & Emplacements', icon: Layers },
            { key: 'movements', label: 'Mouvements de Stock', icon: ArrowUpDown },
            { key: 'inventories', label: 'Inventaires', icon: Boxes },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.key ? 'text-cocoa-400 border-cocoa-500' : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content: Structure */}
        {activeTab === 'structure' && (
          <div className="space-y-6">
            {store.warehouses.map((wh) => (
              <div key={wh.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-slate-800/50 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg"><Warehouse className="w-5 h-5 text-amber-400" /></div>
                    <div>
                      <h3 className="font-bold text-lg">{wh.name}</h3>
                      <span className="text-xs text-slate-400">Capacité : {wh.capacityTonnes} tonnes · {wh.storageZones.length} zone(s)</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {wh.storageZones.map((zone) => (
                    <div key={zone.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-sm">{zone.name}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium text-slate-400">{zone.cocoaGrade}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {zone.locations.map((loc) => {
                          const locOccupancy = loc.capacityKg > 0 ? Math.round((loc.currentWeightKg / loc.capacityKg) * 100) : 0;
                          return (
                            <div key={loc.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-sm font-bold text-white">{loc.code}</span>
                                <span className={`text-xs font-bold ${getOccupancyTextColor(locOccupancy)}`}>{locOccupancy}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                                <div className={`h-full rounded-full transition-all duration-700 ${getOccupancyColor(locOccupancy)}`} style={{ width: `${Math.min(100, locOccupancy)}%` }}></div>
                              </div>
                              <div className="flex justify-between text-xs text-slate-400">
                                <span>{fmt(Math.round(loc.currentWeightKg))} / {fmt(loc.capacityKg)} kg</span>
                                <span>{loc.currentBags} sacs</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content: Movements */}
        {activeTab === 'movements' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-800/50 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-violet-400" /> Derniers Mouvements</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-800">
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Type</th>
                    <th className="p-4 text-right">Poids (kg)</th>
                    <th className="p-4 text-right">Sacs</th>
                    <th className="p-4 text-left">Source</th>
                    <th className="p-4 text-left">Destination</th>
                    <th className="p-4 text-left">Opérateur</th>
                  </tr>
                </thead>
                <tbody>
                  {(store.recentMovements || []).map((mov) => (
                    <tr key={mov.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-300">{fmtDate(mov.date)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TYPE_COLORS[mov.type] || ''}`}>
                          {mov.type === 'IN_PURCHASE' || mov.type === 'INVENTORY_CORRECTION' ? <ArrowDown className="w-3 h-3 inline mr-1" /> : <ArrowUp className="w-3 h-3 inline mr-1" />}
                          {TYPE_LABELS[mov.type] || mov.type}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold">{fmt(Math.round(mov.weightKg))}</td>
                      <td className="p-4 text-right">{mov.bagCount}</td>
                      <td className="p-4 font-mono text-xs">{mov.sourceLocation?.code || '—'}</td>
                      <td className="p-4 font-mono text-xs">{mov.destLocation?.code || '—'}</td>
                      <td className="p-4 text-slate-400">{mov.createdBy?.firstName} {mov.createdBy?.lastName}</td>
                    </tr>
                  ))}
                  {(!store.recentMovements || store.recentMovements.length === 0) && (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">Aucun mouvement enregistré.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Inventories */}
        {activeTab === 'inventories' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cocoa-600 to-amber-600 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-lg hover:shadow-cocoa-500/20 transition-all">
                <Plus className="w-4 h-4" /> Nouvel Inventaire
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase border-b border-slate-800">
                    <th className="p-4 text-left">N° Inventaire</th>
                    <th className="p-4 text-left">Statut</th>
                    <th className="p-4 text-left">Date Début</th>
                    <th className="p-4 text-left">Date Fin</th>
                    <th className="p-4 text-left">Créé par</th>
                    <th className="p-4 text-left">Validé par</th>
                  </tr>
                </thead>
                <tbody>
                  {(store.inventories || []).map((inv) => {
                    const st = INV_STATUS[inv.status] || INV_STATUS.DRAFT;
                    return (
                      <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer">
                        <td className="p-4 font-mono font-bold">{inv.inventoryNumber}</td>
                        <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.color}`}>{st.label}</span></td>
                        <td className="p-4 text-slate-300">{fmtDate(inv.startDate)}</td>
                        <td className="p-4 text-slate-300">{inv.endDate ? fmtDate(inv.endDate) : '—'}</td>
                        <td className="p-4 text-slate-400">{inv.createdBy?.firstName} {inv.createdBy?.lastName}</td>
                        <td className="p-4 text-slate-400">{inv.validatedBy ? `${inv.validatedBy.firstName} ${inv.validatedBy.lastName}` : '—'}</td>
                      </tr>
                    );
                  })}
                  {(!store.inventories || store.inventories.length === 0) && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucun inventaire enregistré.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

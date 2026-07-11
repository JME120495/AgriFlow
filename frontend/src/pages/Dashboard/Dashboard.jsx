import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Layers, ShoppingBag, DollarSign, CreditCard,
  Users as UsersIcon, Store, AlertTriangle, Clock, RefreshCw, Filter, Settings,
  LogOut, ShieldAlert, CheckCircle2, ChevronRight, HelpCircle, Activity, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import DashboardCustomize from './DashboardCustomize';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// MOCK DATA en cas d'absence de backend connecté
const MOCK_KPIS = {
  stock: { totalKg: 45280, totalTonnes: 45.28, totalSacs: 697, value: 67920000 },
  purchases: { count: 18, quantityKg: 4210, amount: 6315000 },
  sales: { quantityKg: 8500, amount: 15725000 },
  finances: { soldeCaisse: 8250000, soldeBancaire: 65125000, profitEstime: 2975000, creditsEnCours: 2450000, repaymentsToday: 180000 },
  actors: { planters: 148, subBuyers: 12, stores: 3, connectedUsers: 5 }
};

const MOCK_CHARTS = {
  evolution: [
    { date: '2026-07-05', achats: 4100000, ventes: 0, achatsKg: 2700, ventesKg: 0 },
    { date: '2026-07-06', achats: 5300000, ventes: 12950000, achatsKg: 3500, ventesKg: 7000 },
    { date: '2026-07-07', achats: 3800000, ventes: 0, achatsKg: 2500, ventesKg: 0 },
    { date: '2026-07-08', achats: 6100000, ventes: 0, achatsKg: 4000, ventesKg: 0 },
    { date: '2026-07-09', achats: 5000000, ventes: 15725000, achatsKg: 3300, ventesKg: 8500 },
    { date: '2026-07-10', achats: 6315000, ventes: 0, achatsKg: 4210, ventesKg: 0 }
  ],
  shareByStore: [
    { name: 'Magasin Central Douala', valeur: 18200000, quantite: 12000 },
    { name: 'Magasin Régional Abengourou', valeur: 12450000, quantite: 8200 },
    { name: 'Magasin Régional Soubré', valeur: 9150000, quantite: 6100 }
  ],
  priceEvolution: [
    { date: '2026-07-05', prixMoyen: 1480 },
    { date: '2026-07-06', prixMoyen: 1510 },
    { date: '2026-07-07', prixMoyen: 1500 },
    { date: '2026-07-08', prixMoyen: 1525 },
    { date: '2026-07-09', prixMoyen: 1495 },
    { date: '2026-07-10', prixMoyen: 1505 }
  ],
  creditEvolution: [
    { date: '2026-07-05', credits: 250000, remboursements: 80000 },
    { date: '2026-07-06', credits: 400000, remboursements: 120000 },
    { date: '2026-07-07', credits: 150000, remboursements: 200000 },
    { date: '2026-07-08', credits: 300000, remboursements: 90000 },
    { date: '2026-07-09', credits: 0, remboursements: 180000 },
    { date: '2026-07-10', credits: 120000, remboursements: 180000 }
  ]
};

const MOCK_ALERTS = [
  { id: '1', type: 'LOW_STOCK', severity: 'WARNING', message: 'Le stock de cacao dans le Magasin Régional Soubré est inférieur à 10 tonnes.', store: { name: 'Magasin Régional Soubré' }, createdAt: '2026-07-10T14:30:00Z' },
  { id: '2', type: 'OVERDUE_CREDIT', severity: 'CRITICAL', message: 'Le crédit de 120 000 FCFA accordé à Alassane Ouattara est en retard de 10 jours.', createdAt: '2026-07-09T09:00:00Z' },
  { id: '3', type: 'WAREHOUSE_FULL', severity: 'WARNING', message: 'Le Magasin Régional Abengourou est rempli à 92% de sa capacité maximale.', store: { name: 'Magasin Régional Abengourou' }, createdAt: '2026-07-11T02:15:00Z' }
];

const MOCK_ACTIVITIES = [
  { id: 'a1', action: 'USER_LOGIN', module: 'auth', details: { email: 'dir@agriflow.com' }, createdAt: '2026-07-11T03:30:00Z', user: { firstName: 'Jean', lastName: 'Dupont', jobTitle: 'Directeur Général' } },
  { id: 'a2', action: 'PURCHASE_CREATE', module: 'purchases', details: { quantity: '420kg', amount: '630,000 FCFA' }, createdAt: '2026-07-11T02:45:00Z', user: { firstName: 'Kouassi', lastName: 'Yao', jobTitle: 'Sous-Acheteur' } },
  { id: 'a3', action: 'CREDIT_CREATE', module: 'credits', details: { amount: '120,000 FCFA', planter: 'Alassane Ouattara' }, createdAt: '2026-07-10T16:15:00Z', user: { firstName: 'Alice', lastName: 'Koffi', jobTitle: 'Chef Comptable' } },
  { id: 'a4', action: 'STOCK_TRANSFER', module: 'stocks', details: { from: 'Abengourou', to: 'Douala', quantity: '5,000kg' }, createdAt: '2026-07-10T11:00:00Z', user: { firstName: 'Toussaint', lastName: 'Boli', jobTitle: 'Magasinier' } }
];

const COLORS = ['#d96348', '#853225', '#eeb29c', '#a53c2a'];

const Dashboard = () => {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();

  // Données
  const [kpis, setKpis] = useState(MOCK_KPIS);
  const [charts, setCharts] = useState(MOCK_CHARTS);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  
  // Filtres
  const [period, setPeriod] = useState('month');
  const [storeFilter, setStoreFilter] = useState('');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);

  // Personnalisation
  const [config, setConfig] = useState({
    visibleKpis: ['stock', 'purchases', 'sales', 'finances', 'actors'],
    layout: { columns: 3 }
  });
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    const params = {
      period,
      storeId: storeFilter,
      startDate: customDates.start,
      endDate: customDates.end
    };

    try {
      const [kpiRes, chartRes, alertRes, actRes, configRes] = await Promise.all([
        api.get('/dashboard/kpis', { params }),
        api.get('/dashboard/charts', { params }),
        api.get('/dashboard/alerts'),
        api.get('/dashboard/activities'),
        api.get('/dashboard/config')
      ]);

      setKpis(kpiRes.data);
      setCharts(chartRes.data);
      setAlerts(alertRes.data);
      setActivities(actRes.data);
      setConfig(configRes.data);
    } catch (err) {
      if (USE_MOCKS) {
        console.warn('[SYS] Échec de la récupération des données réelles du tableau de bord. Utilisation du mock.');
        setKpis(MOCK_KPIS);
        setCharts(MOCK_CHARTS);
        setAlerts(MOCK_ALERTS);
        setActivities(MOCK_ACTIVITIES);
      } else {
        console.error('[SYS] Erreur lors du chargement des données:', err);
        // Fallback to empty states
        setKpis({ stock: {}, purchases: {}, sales: {}, finances: {}, actors: {} });
        setCharts({ evolution: [], shareByStore: [], priceEvolution: [], creditEvolution: [] });
        setAlerts([]);
        setActivities([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, storeFilter]);

  const handleResolveAlert = async (id) => {
    if (!window.confirm("Marquer cette alerte comme résolue ?")) return;
    try {
      // Simuler ou appeler l'API de résolution d'alerte
      // En conditions réelles : await api.put(`/dashboard/alerts/${id}/resolve`);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = () => {
    const role = authUser?.role?.name || 'Collaborateur';
    return role;
  };

  const isMagasinier = authUser?.role?.name === 'MAGASINIER';
  const isSousAcheteur = authUser?.role?.name === 'SOUS_ACHETEUR';

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
            <Link to="/dashboard" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Tableau de bord</Link>
            <Link to="/planters" className="px-3 py-1.5 hover:text-white transition-colors">Planteurs</Link>
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
                {authUser?.firstName || 'Utilisateur'} {authUser?.lastName || ''}
              </span>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors" title="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-fade">
        
        {/* Entête avec filtres globaux */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl shadow-black/10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Vue d'ensemble</h1>
            <p className="text-slate-400 text-sm mt-1">Données et indicateurs de performance de la campagne cacao.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filtre magasin */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-sm w-full sm:w-auto">
              <Store className="w-4 h-4 text-slate-500" />
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="bg-transparent border-none text-slate-300 focus:ring-0 focus:outline-none text-xs"
              >
                <option value="">Tous les magasins</option>
                <option value="store1">Magasin Central Douala</option>
                <option value="store2">Magasin Régional Abengourou</option>
                <option value="store3">Magasin Régional Soubré</option>
              </select>
            </div>

            {/* Filtre période */}
            <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs w-full sm:w-auto justify-between">
              <button onClick={() => setPeriod('today')} className={`px-3 py-1.5 rounded-lg transition-all ${period === 'today' ? 'bg-cocoa-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Jour</button>
              <button onClick={() => setPeriod('week')} className={`px-3 py-1.5 rounded-lg transition-all ${period === 'week' ? 'bg-cocoa-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Semaine</button>
              <button onClick={() => setPeriod('month')} className={`px-3 py-1.5 rounded-lg transition-all ${period === 'month' ? 'bg-cocoa-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Mois</button>
              <button onClick={() => setPeriod('year')} className={`px-3 py-1.5 rounded-lg transition-all ${period === 'year' ? 'bg-cocoa-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Année</button>
            </div>

            {/* Bouton Personnaliser */}
            <button
              onClick={() => setCustomizeOpen(true)}
              className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Personnaliser les indicateurs"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={fetchDashboardData}
              className={`p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section 1 : Indicateurs principaux (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 : Stocks Cacao (Visible par tous, restreint Magasinier) */}
          {config.visibleKpis.includes('stock') && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cocoa-500/10 to-transparent rounded-bl-full"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cacao en stock</span>
                  <h3 className="text-2xl font-black text-white">{kpis.stock.totalKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg</span></h3>
                  <p className="text-xs text-slate-400 mt-1">{kpis.stock.totalTonnes.toFixed(2)} tonnes | {kpis.stock.totalSacs} sacs</p>
                </div>
                <div className="p-3 bg-cocoa-500/10 text-cocoa-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-500">Valeur totale estimée</span>
                <span className="font-bold text-cocoa-400">{kpis.stock.value.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {/* Card 2 : Achats sur Période (Visible par tous) */}
          {config.visibleKpis.includes('purchases') && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Achats période</span>
                  <h3 className="text-2xl font-black text-white">{kpis.purchases.amount.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span></h3>
                  <p className="text-xs text-slate-400 mt-1">{kpis.purchases.quantityKg.toLocaleString()} kg achetés | {kpis.purchases.count} tickets</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-500">Aujourd'hui</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" /> + 8.4%
                </span>
              </div>
            </div>
          )}

          {/* Card 3 : Ventes / CA (Masqué pour Magasiniers/Sous-acheteurs) */}
          {config.visibleKpis.includes('sales') && !isMagasinier && !isSousAcheteur && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ventes période (CA)</span>
                  <h3 className="text-2xl font-black text-white">{kpis.sales.amount.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span></h3>
                  <p className="text-xs text-slate-400 mt-1">{(kpis.sales.quantityKg / 1000).toFixed(1)} tonnes de cacao livrées</p>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-500">Marge brute estimée</span>
                <span className="font-bold text-indigo-400">+{kpis.finances.profitEstime?.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {/* Card 4 : Avances & Crédits en cours (Masqué pour Magasiniers) */}
          {config.visibleKpis.includes('finances') && !isMagasinier && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Crédits en cours</span>
                  <h3 className="text-2xl font-black text-white">{kpis.finances.creditsEnCours?.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span></h3>
                  <p className="text-xs text-slate-400 mt-1">Remboursé aujourd'hui : {kpis.finances.repaymentsToday?.toLocaleString()} FCFA</p>
                </div>
                <div className="p-3 bg-red-500/10 text-red-400 rounded-xl group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-500">Statut recouvrement</span>
                <span className="text-red-400 font-bold">2 alertes retards</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 1.5 : Données Financières additionnelles (Uniquement Directeur/Comptable) */}
        {!isMagasinier && !isSousAcheteur && config.visibleKpis.includes('finances') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg"><DollarSign className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Solde Caisse</p>
                <p className="text-lg font-bold">{kpis.finances.soldeCaisse?.toLocaleString()} FCFA</p>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg"><Store className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Solde Banque</p>
                <p className="text-lg font-bold">{kpis.finances.soldeBancaire?.toLocaleString()} FCFA</p>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg"><UsersIcon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Acteurs Actifs</p>
                <p className="text-lg font-bold">{kpis.actors.planters} planteurs | {kpis.actors.subBuyers} acheteurs</p>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg"><Activity className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Connexions Live</p>
                <p className="text-lg font-bold">{kpis.actors.connectedUsers} utilisateurs actifs</p>
              </div>
            </div>
          </div>
        )}

        {/* Section 2 : Graphiques Interactifs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Graphique 1 : Évolution des achats vs ventes (Largeur 2 colonnes) */}
          <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">Flux commercial de cacao</h3>
                <p className="text-xs text-slate-400">Comparaison des valeurs financières d'achats et de ventes (FCFA).</p>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.evolution}>
                  <defs>
                    <linearGradient id="achatsColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d96348" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#d96348" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ventesColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" name="Achats (FCFA)" dataKey="achats" stroke="#d96348" strokeWidth={2.5} fillOpacity={1} fill="url(#achatsColor)" />
                  {!isMagasinier && !isSousAcheteur && (
                    <Area type="monotone" name="Ventes (FCFA)" dataKey="ventes" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#ventesColor)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique 2 : Répartition des achats par magasin */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-lg font-bold">Répartition par Magasin</h3>
              <p className="text-xs text-slate-400">Contribution de chaque centre de collecte aux achats totaux.</p>
            </div>
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.shareByStore}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="valeur"
                  >
                    {charts.shareByStore.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(value/1000000).toFixed(1)}M FCFA`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-4">
              {charts.shareByStore.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-400 truncate max-w-[120px]" title={item.name}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3 : Graphiques secondaires */}
        {!isMagasinier && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Graphique 3.1 : Évolution du prix moyen d'achat */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Prix moyen d'achat</h3>
                <p className="text-xs text-slate-400">Évolution du prix d'achat du kg de cacao payé aux planteurs (FCFA).</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.priceEvolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 50', 'dataMax + 50']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Line type="monotone" name="Prix Moyen/Kg (FCFA)" dataKey="prixMoyen" stroke="#d96348" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphique 3.2 : Crédits décaissés vs remboursements */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Flux des Crédits Campagne</h3>
                <p className="text-xs text-slate-400">Comparaison journalière des crédits octroyés vs remboursements perçus.</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.creditEvolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend />
                    <Bar name="Crédits octroyés" dataKey="credits" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar name="Remboursements" dataKey="remboursements" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Section 4 : Alertes actives & Activités récentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Panneau d'alertes */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-cocoa-400" />
                  Alertes Actives
                </h3>
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs font-semibold rounded-full">{alerts.length}</span>
              </div>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">Aucune alerte en attente de résolution.</div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border flex gap-3 items-start justify-between transition-all ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-950/20 border-red-500/20 text-red-200'
                          : 'bg-yellow-950/20 border-yellow-500/20 text-yellow-200'
                      }`}
                    >
                      <div className="flex gap-3">
                        <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'}`} />
                        <div>
                          <p className="text-xs font-semibold">{alert.message}</p>
                          <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1">
                            <span>{alert.store?.name || 'Système Global'}</span>
                            <span>•</span>
                            <span>{new Date(alert.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-2 py-1 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white transition-colors"
                      >
                        Résoudre
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Activités récentes */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Activités Récentes
              </h3>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">Aucun événement enregistré.</div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl flex items-center justify-between text-xs hover:border-slate-800 transition-all">
                    <div className="flex gap-3 items-center min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cocoa-400 shrink-0">
                        {act.user?.firstName?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200">
                          {act.user?.firstName} {act.user?.lastName}{' '}
                          <span className="font-normal text-slate-400">a exécuté</span>{' '}
                          <span className="text-indigo-400 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">{act.action}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {act.user?.jobTitle} • {new Date(act.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Modal Customize */}
      {customizeOpen && (
        <DashboardConfig.Provider value={null}>
          <DashboardCustomize
            open={customizeOpen}
            onClose={() => setCustomizeOpen(false)}
            config={config}
            onSave={(newConfig) => {
              setConfig(newConfig);
              // Enregistrer en Boin
              api.post('/dashboard/config', newConfig).catch(() => {});
            }}
          />
        </DashboardConfig.Provider>
      )}
    </div>
  );
};

// Création d'un mini context vide pour l'import de Customize si nécessaire
const DashboardConfig = React.createContext(null);

export default Dashboard;

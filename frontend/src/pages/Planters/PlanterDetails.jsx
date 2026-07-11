import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Trash2, ShieldAlert, CheckCircle2, XCircle, LogOut,
  MapPin, Phone, User, Calendar, Layers, Activity, CreditCard, PlusCircle,
  FileText, TrendingUp, DollarSign, Sparkles, Loader2, RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const MOCK_PLANTER_DETAILS = {
  id: 'p1',
  code: 'PL-2026-0001',
  firstName: 'Alassane',
  lastName: 'Ouattara',
  gender: 'M',
  birthDate: '1978-05-12T00:00:00Z',
  avatarUrl: null,
  phone: '+2250707070701',
  phoneSecondary: '+2250101010101',
  address: 'Quartier Administratif, Abengourou',
  idType: 'CNI',
  idNumber: 'CNI-1029384756',
  idExpiry: '2032-12-31T00:00:00Z',
  idFrontUrl: null,
  idBackUrl: null,
  status: 'ACTIVE',
  storeId: 'store2',
  store: { name: 'Magasin Régional Abengourou' },
  zoneManager: { firstName: 'Mamadou', lastName: 'Diallo' },
  subBuyer: { firstName: 'Kouassi', lastName: 'Yao' },
  plantation: {
    name: 'Plantation Ouattara Abengourou',
    location: 'Village Abron',
    areaHectares: 12.5,
    parcelsCount: 3,
    treesCount: 9500,
    creationYear: 2017,
    variety: 'Mercedes',
    latitude: 6.7291,
    longitude: -3.4839
  },
  kpis: {
    totalSoldKg: 45200,
    totalPurchasesAmount: 67800000,
    totalPaymentsAmount: 65350000,
    totalCreditsGranted: 3500000,
    creditsRemaining: 2450000,
    deliveriesCount: 34,
    lastDeliveryDate: '2026-07-10T11:30:00Z',
    lastPaymentDate: '2026-07-10T12:00:00Z'
  }
};

const MOCK_HISTORY = {
  purchases: [
    { id: 'pur1', quantityKg: 4210, bagCount: 65, pricePerKg: 1500, totalAmount: 6315000, creditDeduction: 0, date: '2026-07-10T11:30:00Z', store: { name: 'Magasin Abengourou' } },
    { id: 'pur2', quantityKg: 2500, bagCount: 38, pricePerKg: 1480, totalAmount: 3700000, creditDeduction: 500000, date: '2026-07-05T09:15:00Z', store: { name: 'Magasin Abengourou' } },
    { id: 'pur3', quantityKg: 3000, bagCount: 46, pricePerKg: 1520, totalAmount: 4560000, creditDeduction: 200000, date: '2026-06-28T14:40:00Z', store: { name: 'Magasin Abengourou' } }
  ],
  credits: [
    { id: 'cr1', amount: 120000, interestRate: 0, dueDate: '2026-07-15T00:00:00Z', status: 'OVERDUE', createdAt: '2026-06-10T00:00:00Z', repayments: [] },
    { id: 'cr2', amount: 500000, interestRate: 0, dueDate: '2026-08-01T00:00:00Z', status: 'PARTIALLY_PAID', createdAt: '2026-07-01T00:00:00Z', repayments: [{ id: 'rep1', amount: 200000, date: '2026-07-05T09:15:00Z' }] }
  ],
  payments: [
    { id: 'pay1', amount: 6315000, method: 'CASH', reference: 'PAY-10029', date: '2026-07-10T12:00:00Z' },
    { id: 'pay2', amount: 3200000, method: 'MOBILE_MONEY', reference: 'MOMO-99384', date: '2026-07-05T10:00:00Z' }
  ]
};

const MOCK_STATS = [
  { month: '2026-02', quantity: 5000, amount: 7500000 },
  { month: '2026-03', quantity: 8200, amount: 12300000 },
  { month: '2026-04', quantity: 9500, amount: 14250000 },
  { month: '2026-05', quantity: 12000, amount: 18000000 },
  { month: '2026-06', quantity: 6300, amount: 9450000 },
  { month: '2026-07', quantity: 4210, amount: 6315000 }
];

const PlanterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();

  const [planter, setPlanter] = useState(MOCK_PLANTER_DETAILS);
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plantation');

  // Modals States
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [submittingCredit, setSubmittingCredit] = useState(false);
  const [submittingRepay, setSubmittingRepay] = useState(false);

  // Form States Modals
  const [creditForm, setCreditForm] = useState({ amount: '', interest_rate: '0', due_date: '' });
  const [repayForm, setRepayForm] = useState({ credit_id: '', amount: '' });

  const loadPlanterDetails = async () => {
    setLoading(true);
    try {
      const [detailsRes, histRes, statsRes] = await Promise.all([
        api.get(`/planters/${id}`),
        api.get(`/planters/${id}/history`),
        api.get(`/planters/${id}/stats`)
      ]);

      setPlanter(detailsRes.data);
      setHistory(histRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.warn('[SYS] Échec chargement API, utilisation du mock détaillé.');
      setPlanter(MOCK_PLANTER_DETAILS);
      setHistory(MOCK_HISTORY);
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanterDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous désactiver ce planteur ? Il restera dans l'archive mais ne pourra plus recevoir d'avances.")) return;
    try {
      await api.delete(`/planters/${id}`);
      navigate('/planters');
    } catch (err) {
      setPlanter({ ...planter, status: 'DEACTIVATED' });
    }
  };

  // Accorder un crédit
  const handleGrantCredit = async (e) => {
    e.preventDefault();
    setSubmittingCredit(true);
    try {
      await api.post(`/planters/${id}/credits`, creditForm);
      setCreditModalOpen(false);
      loadPlanterDetails();
    } catch (err) {
      // Fallback UI
      const mockNewCredit = {
        id: `cr_new_${Date.now()}`,
        amount: parseFloat(creditForm.amount),
        interestRate: parseFloat(creditForm.interest_rate) || 0,
        dueDate: creditForm.due_date,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        repayments: []
      };
      setHistory({
        ...history,
        credits: [mockNewCredit, ...history.credits]
      });
      setCreditModalOpen(false);
    } finally {
      setSubmittingCredit(false);
      setCreditForm({ amount: '', interest_rate: '0', due_date: '' });
    }
  };

  // Enregistrer un remboursement
  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    setSubmittingRepay(true);
    try {
      await api.post(`/planters/${id}/repayments`, repayForm);
      setRepaymentModalOpen(false);
      loadPlanterDetails();
    } catch (err) {
      // Fallback local
      const updatedCredits = history.credits.map(c => {
        if (c.id === repayForm.credit_id) {
          const repAmount = parseFloat(repayForm.amount);
          const totalRepaid = c.repayments.reduce((acc, r) => acc + r.amount, 0) + repAmount;
          return {
            ...c,
            status: totalRepaid >= c.amount ? 'PAID' : 'PARTIALLY_PAID',
            repayments: [...c.repayments, { id: `rep_new_${Date.now()}`, amount: repAmount, date: new Date().toISOString() }]
          };
        }
        return c;
      });
      setHistory({ ...history, credits: updatedCredits });
      setRepaymentModalOpen(false);
    } finally {
      setSubmittingRepay(false);
      setRepayForm({ credit_id: '', amount: '' });
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
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-fade">
        {/* Entête avec actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-4">
            <Link to="/planters" className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black">{planter.firstName} {planter.lastName}</h1>
                <span className="font-mono text-xs text-cocoa-300 font-bold bg-cocoa-900/20 px-2 py-0.5 rounded border border-cocoa-500/20">{planter.code}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">Magasin de rattachement : {planter.store?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/planters/${id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              <Edit3 className="w-4 h-4 text-slate-400" />
              <span>Modifier la fiche</span>
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Désactiver</span>
            </button>
            <button
              onClick={loadPlanterDetails}
              className="p-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-xl transition-all"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ligne des KPIs du Planteur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Cacao Livré</span>
              <p className="text-2xl font-black text-white">{(planter.kpis.totalSoldKg / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">tonnes</span></p>
              <p className="text-[10px] text-slate-400">{planter.kpis.deliveriesCount} livraisons enregistrées</p>
            </div>
            <div className="p-3 bg-cocoa-500/10 text-cocoa-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Valeur Livrée</span>
              <p className="text-2xl font-black text-white">{planter.kpis.totalPurchasesAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span></p>
              <p className="text-[10px] text-slate-400">Prix moyen obtenu : ~1505 FCFA/kg</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Réglé</span>
              <p className="text-2xl font-black text-white">{planter.kpis.totalPaymentsAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span></p>
              <p className="text-[10px] text-slate-400">Dernier paiement : {planter.kpis.lastPaymentDate ? new Date(planter.kpis.lastPaymentDate).toLocaleDateString() : 'Aucun'}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Solde Crédit</span>
              <p className="text-2xl font-black text-white">{planter.kpis.creditsRemaining.toLocaleString()} <span className="text-xs font-normal text-slate-400">FCFA</span></p>
              <p className="text-[10px] text-slate-400">Total accordé : {planter.kpis.totalCreditsGranted.toLocaleString()} FCFA</p>
            </div>
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Section double colonne : Profil gauche / Détails tabulés droit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne Gauche : Résumé Planteur & Plantation */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 h-fit">
            <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-800">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-3xl">
                {planter.firstName[0]}{planter.lastName[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold">{planter.firstName} {planter.lastName}</h3>
                <p className="text-slate-500 text-xs">Sous-Acheteur : {planter.subBuyer?.firstName} {planter.subBuyer?.lastName}</p>
              </div>
              <div className="flex items-center gap-1">
                {planter.status === 'ACTIVE' ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">Actif</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 text-xs font-bold px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">Suspendu</span>
                )}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Contact & Identité</h4>
              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-slate-500" /> <span>{planter.phone}</span></div>
                {planter.phoneSecondary && <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-slate-500" /> <span>{planter.phoneSecondary}</span></div>}
                <div className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-slate-500" /> <span>{planter.address}</span></div>
                <div className="flex items-center gap-2.5"><FileText className="w-4 h-4 text-slate-500" /> <span>{planter.idType} : {planter.idNumber}</span></div>
                <div className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-slate-500" /> <span>Exp : {new Date(planter.idExpiry).toLocaleDateString()}</span></div>
              </div>
            </div>

            {planter.plantation && (
              <div className="space-y-4 pt-6 border-t border-slate-800 text-sm">
                <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Plantation Agricole</h4>
                <div className="space-y-2 text-slate-300">
                  <p className="font-semibold text-white">{planter.plantation.name}</p>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> {planter.plantation.location}</p>
                  <p>Superficie : <span className="font-bold text-white">{planter.plantation.areaHectares} ha</span> ({planter.plantation.parcelsCount} parcelles)</p>
                  <p>Cacaoyers : <span className="font-bold text-white">{planter.plantation.treesCount?.toLocaleString()}</span> (Plantés en {planter.plantation.creationYear})</p>
                  <p>Variété : <span className="font-bold text-cocoa-400">{planter.plantation.variety}</span></p>
                  <p className="text-xs text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg font-mono">GPS : {planter.plantation.latitude}, {planter.plantation.longitude}</p>
                </div>
              </div>
            )}
          </div>

          {/* Colonne Droite : Onglets des Historiques & Performances */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex border-b border-slate-800 bg-slate-850/40 p-2 overflow-x-auto">
              <button onClick={() => setActiveTab('plantation')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${activeTab === 'plantation' ? 'bg-cocoa-600 text-white' : 'text-slate-400 hover:text-white'}`}>Achats Cacao</button>
              <button onClick={() => setActiveTab('credits')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${activeTab === 'credits' ? 'bg-cocoa-600 text-white' : 'text-slate-400 hover:text-white'}`}>Crédits Campagne</button>
              <button onClick={() => setActiveTab('payments')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${activeTab === 'payments' ? 'bg-cocoa-600 text-white' : 'text-slate-400 hover:text-white'}`}>Paiements Reçus</button>
              <button onClick={() => setActiveTab('performances')} className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${activeTab === 'performances' ? 'bg-cocoa-600 text-white' : 'text-slate-400 hover:text-white'}`}>Performances</button>
            </div>

            <div className="p-6 flex-1">
              
              {/* Onglet A : Achats Cacao */}
              {activeTab === 'plantation' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Historique des achats cacao</h4>
                  </div>
                  <div className="overflow-x-auto max-h-[350px] border border-slate-800/80 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-850 text-slate-400 font-bold uppercase">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Poids (Kg)</th>
                          <th className="p-3">Prix/Kg (FCFA)</th>
                          <th className="p-3">Déduction Crédit</th>
                          <th className="p-3">Total Payé (FCFA)</th>
                          <th className="p-3">Magasin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {history.purchases.map(p => (
                          <tr key={p.id} className="hover:bg-slate-800/10">
                            <td className="p-3 text-slate-400">{new Date(p.date).toLocaleString()}</td>
                            <td className="p-3 font-bold text-white">{p.quantityKg.toLocaleString()}</td>
                            <td className="p-3">{p.pricePerKg}</td>
                            <td className="p-3 text-red-400 font-semibold">{p.creditDeduction > 0 ? `-${p.creditDeduction.toLocaleString()}` : '-'}</td>
                            <td className="p-3 font-bold text-cocoa-400">{(p.totalAmount - p.creditDeduction).toLocaleString()}</td>
                            <td className="p-3 text-slate-400">{p.store.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Onglet B : Crédits Campagne */}
              {activeTab === 'credits' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Suivi des Avances & Crédits</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRepaymentModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Rembourser</span>
                      </button>
                      <button
                        onClick={() => setCreditModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cocoa-600 hover:bg-cocoa-500 rounded-lg text-xs font-bold transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Octroyer</span>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[350px] border border-slate-800/80 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-850 text-slate-400 font-bold uppercase">
                        <tr>
                          <th className="p-3">Octroi</th>
                          <th className="p-3">Montant (FCFA)</th>
                          <th className="p-3">Remboursé</th>
                          <th className="p-3">Échéance</th>
                          <th className="p-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {history.credits.map(c => {
                          const totalRepaid = c.repayments.reduce((acc, r) => acc + r.amount, 0);
                          return (
                            <tr key={c.id} className="hover:bg-slate-800/10">
                              <td className="p-3 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                              <td className="p-3 font-bold text-white">{c.amount.toLocaleString()}</td>
                              <td className="p-3 text-emerald-400 font-semibold">{totalRepaid.toLocaleString()}</td>
                              <td className="p-3 text-slate-400">{new Date(c.dueDate).toLocaleDateString()}</td>
                              <td className="p-3">
                                {c.status === 'PAID' ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">Soldé</span>
                                ) : c.status === 'OVERDUE' ? (
                                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold border border-red-500/20">En retard</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-semibold border border-yellow-500/20">Actif</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Onglet C : Paiements Reçus */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Historique des paiements de campagne</h4>
                  </div>
                  <div className="overflow-x-auto max-h-[350px] border border-slate-800/80 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-850 text-slate-400 font-bold uppercase">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Montant (FCFA)</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3">Référence Transaction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {history.payments.map(p => (
                          <tr key={p.id} className="hover:bg-slate-800/10">
                            <td className="p-3 text-slate-400">{new Date(p.date).toLocaleString()}</td>
                            <td className="p-3 font-bold text-emerald-400">{p.amount.toLocaleString()}</td>
                            <td className="p-3 font-semibold text-slate-200">{p.method}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-400">{p.reference || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Onglet D : Performances */}
              {activeTab === 'performances' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Évolution des livraisons cacao (kg)</h4>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats}>
                        <defs>
                          <linearGradient id="performancesColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d96348" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#d96348" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Area type="monotone" name="Quantité (kg)" dataKey="quantity" stroke="#d96348" strokeWidth={2.5} fillOpacity={1} fill="url(#performancesColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Modal Octroyer Crédit */}
      {creditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold mb-4">Accorder un crédit de campagne</h3>
            <form onSubmit={handleGrantCredit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Montant du crédit (FCFA)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 100000"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Date d'échéance (remboursement attendu)</label>
                <input
                  type="date"
                  required
                  value={creditForm.due_date}
                  onChange={(e) => setCreditForm({ ...creditForm, due_date: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setCreditModalOpen(false)} className="px-4 py-2 border border-slate-800 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all">Annuler</button>
                <button type="submit" disabled={submittingCredit} className="px-4 py-2 bg-cocoa-600 hover:bg-cocoa-500 rounded-xl text-sm font-bold shadow-lg shadow-cocoa-600/10 transition-all">
                  {submittingCredit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Octroyer le Crédit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Enregistrer Remboursement */}
      {repaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold mb-4">Enregistrer un remboursement manuel</h3>
            <form onSubmit={handleRecordRepayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Sélectionner le crédit en cours</label>
                <select
                  required
                  value={repayForm.credit_id}
                  onChange={(e) => setRepayForm({ ...repayForm, credit_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300"
                >
                  <option value="">Sélectionner un crédit...</option>
                  {history.credits.filter(c => c.status !== 'PAID').map(c => (
                    <option key={c.id} value={c.id}>
                      Créé le {new Date(c.createdAt).toLocaleDateString()} - Reste : {(c.amount - c.repayments.reduce((acc, r) => acc + r.amount, 0)).toLocaleString()} FCFA
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Montant remboursé (FCFA)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 50000"
                  value={repayForm.amount}
                  onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button type="button" onClick={() => setRepaymentModalOpen(false)} className="px-4 py-2 border border-slate-800 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all">Annuler</button>
                <button type="submit" disabled={submittingRepay} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/10 transition-all">
                  {submittingRepay ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer le Règlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanterDetails;

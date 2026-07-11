import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Calendar, MapPin, User, Shield, AlertTriangle, CheckCircle, 
  DollarSign, TrendingUp, Award, Layers, CreditCard, ChevronRight, 
  FileText, Plus, Check, X, ShieldAlert, Sparkles, Scale, Trash 
} from 'lucide-react';

const MOCK_DETAIL = {
  id: 'sb1',
  firstName: 'Kouassi',
  lastName: 'Yao',
  email: 'acheteur1@agriflow.com',
  phone: '+2250707070799',
  status: 'ACTIVE',
  store: { name: 'Magasin Régional Abengourou' },
  manager: { firstName: 'Mamadou', lastName: 'Diallo' },
  subBuyerProfile: {
    id: 'prof1',
    gender: 'M',
    birthDate: '1985-06-15',
    phoneSecondary: '+2250102030405',
    idType: 'CNI',
    idNumber: 'CI009876543',
    idExpiryDate: '2030-12-31',
    idFrontUrl: '',
    idBackUrl: '',
    purchaseZone: 'Zone Est Soubré',
    region: 'La Nawa',
    department: 'Soubré',
    district: 'Soubré',
    mainVillage: 'Kpéhiri',
    creditLimit: 5000000.0,
    collaborationStartDate: '2025-04-01',
    advances: [
      { id: 'a1', code: 'AV-2026-06-0001', amount: 4000000, remainingAmount: 500000, reason: 'ACHAT_CACAO', paymentMethod: 'MOBILE_MONEY', status: 'PARTIALLY_JUSTIFIED', date: '2026-06-16T08:00:00Z', observations: 'Avance de début de mois' }
    ],
    expenses: [
      { id: 'e1', amount: 150000, category: 'TRANSPORT', description: 'Location camionnette pour piste de brousse', status: 'APPROVED', date: '2026-06-21T10:00:00Z' },
      { id: 'e2', amount: 45000, category: 'BAGS', description: 'Achat complémentaire de sacs brousse', status: 'PENDING', date: '2026-07-09T14:30:00Z' }
    ],
    deliveries: [
      { id: 'd1', code: 'LIV-2026-06-0001', deliveryDate: '2026-06-26T16:00:00Z', declaredQuantityKg: 2000, declaredBagCount: 31, receivedQuantityKg: 1980, receivedBagCount: 31, lossQuantityKg: 20, lossPercentage: 1.0, moistureContent: 7.4, status: 'VALIDATED', notes: 'Livraison reçue conforme, perte de 1% dans les tolérances.' },
      { id: 'd2', code: 'LIV-2026-06-0002', deliveryDate: '2026-07-06T11:00:00Z', declaredQuantityKg: 1500, declaredBagCount: 23, receivedQuantityKg: 1440, receivedBagCount: 23, lossQuantityKg: 60, lossPercentage: 4.0, moistureContent: 8.2, status: 'LITIGATION', alertTriggered: true, notes: 'Humidité trop élevée et perte de poids anormale de 4% (60 Kg manquants). Dossier en litige.' }
    ],
    ledgerEntries: [
      { id: 'l1', type: 'CREDIT', amount: 4000000, balance: 4000000, description: "Avance de début de mois pour achats de cacao", date: '2026-06-16T08:00:00Z' },
      { id: 'l2', type: 'DEBIT', amount: 150000, balance: 3850000, description: "Justification de dépense validée : Location camionnette", date: '2026-06-21T10:00:00Z' },
      { id: 'l3', type: 'DEBIT', amount: 3564000, balance: 286000, description: "Livraison de cacao enregistrée Réf: LIV-2026-06-0001", date: '2026-06-26T16:00:00Z' }
    ]
  }
};

const SubBuyerDetail = () => {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const [subBuyer, setSubBuyer] = useState(MOCK_DETAIL);
  const [stats, setStats] = useState({
    currentBalance: 286000,
    totalAdvances: 4000000,
    totalUnjustified: 500000,
    purchasedToday: 0,
    purchasedMonth: 12400,
    purchasedYear: 89200,
    activePlantersCount: 18,
    deliveriesCount: 2,
    avgPurchasePrice: 1500,
    avgCostPerKg: 1620,
    performanceScore: 94
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals status
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isWeighModalOpen, setIsWeighModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Form states
  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: 'ACHAT_CACAO', paymentMethod: 'CASH', observations: '' });
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'TRANSPORT', description: '', receiptUrl: '' });
  const [weighForm, setWeighForm] = useState({ receivedQuantityKg: '', receivedBagCount: '', moistureContent: '7.5', subgradePercentage: '0.5', notes: '' });

  const [errorMsg, setErrorMsg] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sub-buyers/${id}`);
      setSubBuyer(res.data || MOCK_DETAIL);
      const statsRes = await api.get(`/sub-buyers/${id}/stats`);
      setStats(statsRes.data);
    } catch (err) {
      console.warn('[SYS] Échec chargement API backend, utilisation du mock détaillé.');
      setSubBuyer(MOCK_DETAIL);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleGrantAdvance = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post(`/sub-buyers/${id}/advances`, advanceForm);
      setIsAdvanceModalOpen(false);
      setAdvanceForm({ amount: '', reason: 'ACHAT_CACAO', paymentMethod: 'CASH', observations: '' });
      fetchDetail();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Erreur lors de l'octroi de l'avance.");
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/sub-buyers/${id}/expenses`, expenseForm);
      setIsExpenseModalOpen(false);
      setExpenseForm({ amount: '', category: 'TRANSPORT', description: '', receiptUrl: '' });
      fetchDetail();
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la dépense.");
    }
  };

  const handleValidateExpense = async (expenseId, status) => {
    try {
      await api.post(`/sub-buyers/expenses/${expenseId}/validate`, { status });
      fetchDetail();
    } catch (err) {
      alert("Erreur de validation de la dépense.");
    }
  };

  const handleWeighDeliverySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/sub-buyers/deliveries/${selectedDelivery.id}/weigh`, weighForm);
      setIsWeighModalOpen(false);
      setSelectedDelivery(null);
      setWeighForm({ receivedQuantityKg: '', receivedBagCount: '', moistureContent: '7.5', subgradePercentage: '0.5', notes: '' });
      fetchDetail();
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la pesée.");
    }
  };

  const handleSuspend = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir suspendre ce sous-acheteur ? Il ne pourra plus recevoir d'avances ni enregistrer d'achats.")) {
      try {
        await api.post(`/sub-buyers/${id}/suspend`, { reason: 'Suspension manuelle par direction.' });
        fetchDetail();
      } catch (err) {
        alert('Erreur lors de la suspension.');
      }
    }
  };

  const profile = subBuyer.subBuyerProfile || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cocoa-500/30 flex flex-col">
      <header className="px-8 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/sub-buyers" className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xl font-bold tracking-tight">Fiche Sous-acheteur</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            subBuyer.status === 'ACTIVE'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {subBuyer.status === 'ACTIVE' ? 'COMPTE ACTIF' : 'COMPTE SUSPENDU'}
          </span>
          {subBuyer.status === 'ACTIVE' && (authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'COMPTABLE') && (
            <button onClick={handleSuspend} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors">
              Suspendre le collecteur
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Profile Info */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-black/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-amber-600/10 uppercase">
              {subBuyer.firstName?.[0]}{subBuyer.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{subBuyer.firstName} {subBuyer.lastName}</h1>
              <p className="text-slate-400 text-sm mt-0.5">{subBuyer.phone} • {subBuyer.email || 'Pas d\'email'}</p>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2 font-medium">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> {profile.purchaseZone} ({profile.mainVillage})</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Début collab : {new Date(profile.collaborationStartDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto text-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 min-w-[140px]">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Solde Disponible</p>
              <h4 className="text-lg font-mono font-bold text-amber-400 mt-0.5">{stats.currentBalance.toLocaleString()} FCFA</h4>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 min-w-[140px]">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Non justifié</p>
              <h4 className="text-lg font-mono font-bold text-red-400 mt-0.5">{stats.totalUnjustified.toLocaleString()} FCFA</h4>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-slate-800 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Vue d\'ensemble' },
            { id: 'advances', label: 'Avances de fonds' },
            { id: 'expenses', label: 'Dépenses brousse' },
            { id: 'deliveries', label: 'Livraisons Magasin' },
            { id: 'ledger', label: 'Grand Livre / Portefeuille' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                activeTab === t.id
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Achat ce mois</span>
                <span className="text-xl font-bold mt-1 block">{stats.purchasedMonth.toLocaleString()} Kg</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Achat cette année</span>
                <span className="text-xl font-bold mt-1 block">{stats.purchasedYear.toLocaleString()} Kg</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Planteurs Actifs</span>
                <span className="text-xl font-bold mt-1 block text-indigo-400">{stats.activePlantersCount} producteurs</span>
              </div>
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Score de Performance</span>
                <span className="text-xl font-bold mt-1 block text-emerald-400">{stats.performanceScore}/100</span>
              </div>
            </div>

            {/* KYC & Identity verification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Vérification d'Identité KYC</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Type de pièce</span>
                    <span className="font-semibold">{profile.idType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Numéro de pièce</span>
                    <span className="font-semibold font-mono">{profile.idNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Expiration</span>
                    <span className="font-semibold text-slate-300">{new Date(profile.idExpiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Geo distribution */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 col-span-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Territoire & Logistique</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Région / Département</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">{profile.region} • {profile.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Arrondissement / Village</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">{profile.district} • {profile.mainVillage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Magasin de rattachement</span>
                    <span className="font-bold text-amber-500 mt-0.5 block">{subBuyer.store?.name || 'Magasin Central'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Plafond d'avance de campagne</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">{profile.creditLimit?.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Advances */}
        {activeTab === 'advances' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Historique des avances accordées</h3>
              {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'COMPTABLE') && (
                <button
                  onClick={() => setIsAdvanceModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Accorder une avance</span>
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Réf / Date</th>
                    <th className="p-4">Montant initial</th>
                    <th className="p-4">Reste à justifier</th>
                    <th className="p-4">Motif</th>
                    <th className="p-4">Mode Paiement</th>
                    <th className="p-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {profile.advances?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">Aucune avance allouée à ce jour.</td>
                    </tr>
                  ) : (
                    profile.advances?.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-850/20">
                        <td className="p-4">
                          <p className="font-semibold text-white">{adv.code}</p>
                          <p className="text-xs text-slate-500">{new Date(adv.date).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-200">{adv.amount.toLocaleString()} FCFA</td>
                        <td className="p-4 font-mono font-semibold text-amber-400">{adv.remainingAmount.toLocaleString()} FCFA</td>
                        <td className="p-4 text-slate-300">{adv.reason}</td>
                        <td className="p-4 text-xs text-slate-400">{adv.paymentMethod}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            adv.status === 'FULLY_JUSTIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : adv.status === 'PARTIALLY_JUSTIFIED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {adv.status === 'FULLY_JUSTIFIED' ? 'Justifié' : adv.status === 'PARTIALLY_JUSTIFIED' ? 'Partiel' : 'Décaissement'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Expenses */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Dépenses opérationnelles de brousse</h3>
              {authUser?.role?.name === 'SOUS_ACHETEUR' && (
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Déclarer une dépense</span>
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Date / Catégorie</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Validation Comptable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {profile.expenses?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Aucune dépense enregistrée.</td>
                    </tr>
                  ) : (
                    profile.expenses?.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-850/20">
                        <td className="p-4">
                          <p className="font-semibold text-white">{exp.category}</p>
                          <p className="text-xs text-slate-500">{new Date(exp.date).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4 text-slate-300 max-w-[280px] truncate">{exp.description}</td>
                        <td className="p-4 font-mono font-semibold text-slate-200">{exp.amount.toLocaleString()} FCFA</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            exp.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : exp.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {exp.status === 'APPROVED' ? 'Approuvé' : exp.status === 'REJECTED' ? 'Rejeté' : 'En attente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {exp.status === 'PENDING' && (authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'COMPTABLE') ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleValidateExpense(exp.id, 'APPROVED')}
                                className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded border border-emerald-500/20 transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleValidateExpense(exp.id, 'REJECTED')}
                                className="p-1 text-red-400 hover:bg-red-500/10 rounded border border-red-500/20 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : exp.status === 'APPROVED' ? (
                            <span className="text-[11px] text-slate-500">Validé</span>
                          ) : (
                            <span className="text-[11px] text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Deliveries */}
        {activeTab === 'deliveries' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Livraisons de cacao effectuées au magasin</h3>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Code / Date</th>
                    <th className="p-4">Déclaré (Pisteur)</th>
                    <th className="p-4">Pesé (Magasinier)</th>
                    <th className="p-4">Écart / Pertes</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {profile.deliveries?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">Aucune livraison enregistrée.</td>
                    </tr>
                  ) : (
                    profile.deliveries?.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-850/20">
                        <td className="p-4">
                          <p className="font-semibold text-white">{d.code}</p>
                          <p className="text-xs text-slate-500">{new Date(d.deliveryDate).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4 text-slate-300">
                          <p className="font-medium">{d.declaredQuantityKg} Kg</p>
                          <p className="text-xs text-slate-500">{d.declaredBagCount} sacs</p>
                        </td>
                        <td className="p-4 text-slate-200">
                          {d.receivedQuantityKg ? (
                            <>
                              <p className="font-medium text-slate-200">{d.receivedQuantityKg} Kg</p>
                              <p className="text-xs text-slate-500">{d.receivedBagCount} sacs weighed</p>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 font-italic">En attente de pesée</span>
                          )}
                        </td>
                        <td className="p-4">
                          {d.lossQuantityKg !== null ? (
                            <div className="flex flex-col">
                              <span className={`font-semibold text-sm ${d.alertTriggered ? 'text-red-400' : 'text-slate-300'}`}>
                                {d.lossQuantityKg.toFixed(1)} Kg
                              </span>
                              <span className="text-[10px] text-slate-500">({d.lossPercentage.toFixed(2)}% perte)</span>
                            </div>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            d.status === 'VALIDATED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : d.status === 'LITIGATION'
                              ? 'bg-red-500/10 text-red-400 font-black animate-pulse'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {d.status === 'VALIDATED' ? 'Reçu OK' : d.status === 'LITIGATION' ? 'LITIGE' : 'En route'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {d.status === 'SUBMITTED' && (authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'MAGASINIER') ? (
                            <button
                              onClick={() => { setSelectedDelivery(d); setIsWeighModalOpen(true); }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>Enregistrer Pesée</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">Validé</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Grand livre du Portefeuille</h3>
              {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'COMPTABLE') && (
                <button
                  onClick={() => {
                    const amt = window.prompt("Entrez le montant de remboursement en espèces (FCFA) :");
                    if (amt && !isNaN(amt)) {
                      api.post(`/sub-buyers/${id}/repayments`, { amount: Number(amt), observations: 'Remboursement direct en espèces au guichet' })
                        .then(() => fetchDetail());
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-700"
                >
                  Remboursement Espèces
                </button>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Date / Heure</th>
                    <th className="p-4">Désignation de l'écriture</th>
                    <th className="p-4">Débit (Diminution Dû)</th>
                    <th className="p-4">Crédit (Avance / Dû)</th>
                    <th className="p-4">Solde dû progressif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm font-mono">
                  {profile.ledgerEntries?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Aucun mouvement comptable.</td>
                    </tr>
                  ) : (
                    profile.ledgerEntries?.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-850/20">
                        <td className="p-4 text-xs text-slate-500 font-sans">
                          {new Date(l.date).toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-300 font-sans font-medium">{l.description}</td>
                        <td className="p-4 text-emerald-400">
                          {l.type === 'DEBIT' ? `-${l.amount.toLocaleString()} FCFA` : '-'}
                        </td>
                        <td className="p-4 text-red-400">
                          {l.type === 'CREDIT' ? `+${l.amount.toLocaleString()} FCFA` : '-'}
                        </td>
                        <td className="p-4 text-slate-200 font-bold">
                          {l.balance.toLocaleString()} FCFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Accorder Avance */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4">Accorder une avance de fonds</h2>
            {errorMsg && (
              <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleGrantAdvance} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Montant (FCFA)</label>
                <input
                  type="number"
                  required
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Motif</label>
                <select
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                >
                  <option value="ACHAT_CACAO">Achat de Cacao</option>
                  <option value="LOGISTIQUE_TRANSPORT">Transport & Logistique</option>
                  <option value="INTRANTS">Fourniture Intrants</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Mode de Paiement</label>
                <select
                  value={advanceForm.paymentMethod}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, paymentMethod: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none"
                >
                  <option value="CASH">Caisse Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Virement Bancaire</option>
                </select>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button type="button" onClick={() => setIsAdvanceModalOpen(false)} className="px-4 py-2 border border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-850">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold">Décourager les fonds</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pesée Magasinier */}
      {isWeighModalOpen && selectedDelivery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative">
            <h2 className="text-xl font-bold mb-1">Pesée et Réception Magasin</h2>
            <p className="text-xs text-slate-500 mb-6">Livraison Réf: {selectedDelivery.code} (Pisteur: {subBuyer.firstName} {subBuyer.lastName})</p>

            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-sm">
              <div>
                <span className="text-slate-500 text-xs">Poids Déclaré</span>
                <span className="block font-bold text-slate-200 mt-0.5">{selectedDelivery.declaredQuantityKg} Kg</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Sacs Déclarés</span>
                <span className="block font-bold text-slate-200 mt-0.5">{selectedDelivery.declaredBagCount} sacs</span>
              </div>
            </div>

            <form onSubmit={handleWeighDeliverySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Poids Net Pesé (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weighForm.receivedQuantityKg}
                    onChange={(e) => setWeighForm({ ...weighForm, receivedQuantityKg: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Sacs Reçus</label>
                  <input
                    type="number"
                    required
                    value={weighForm.receivedBagCount}
                    onChange={(e) => setWeighForm({ ...weighForm, receivedBagCount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Humidité (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weighForm.moistureContent}
                    onChange={(e) => setWeighForm({ ...weighForm, moistureContent: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1 uppercase">Sous-grade / Déchets (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weighForm.subgradePercentage}
                    onChange={(e) => setWeighForm({ ...weighForm, subgradePercentage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-6">
                <button type="button" onClick={() => setIsWeighModalOpen(false)} className="px-4 py-2 border border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-850">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold">Valider la pesée</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubBuyerDetail;

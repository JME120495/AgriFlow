import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogOut, ChevronLeft, MapPin, Target, Users, Calendar, Award, Phone, Mail, UserCheck } from 'lucide-react';

const MOCK_MANAGER = {
  id: 'm1',
  userId: 'u1',
  gender: 'M',
  photoUrl: null,
  phoneSecondary: '+237688888801',
  recruitmentDate: '2026-07-01T00:00:00.000Z',
  status: 'ACTIVE',
  user: {
    id: 'u1',
    firstName: 'Jean Marcel',
    lastName: 'Essono',
    email: 'essonojeanmarcel@gmail.com',
    phone: '+237699999901',
    subordinates: [
      { id: 'sb1', firstName: 'Paul', lastName: 'Koffi', role: { name: 'SOUS_ACHETEUR' } },
      { id: 'sb2', firstName: 'Jean', lastName: 'Gervais', role: { name: 'SOUS_ACHETEUR' } }
    ]
  },
  zones: [
    { id: 'z1', name: 'Zone Abengourou Est', level: 'DISTRICT', code: 'CIV-EST-ABE-01' },
    { id: 'z2', name: 'Village Niablé', level: 'VILLAGE', code: 'CIV-EST-ABE-02' }
  ],
  assignments: [
    { id: 'as1', zone: { name: 'Zone Abengourou Est', level: 'DISTRICT' } }
  ],
  planterVisits: [
    { id: 'v1', visitDate: '2026-07-10T14:00:00Z', purpose: 'AGRONOMIC_CONTROL', comments: 'Vérification de la maturation des cabosses sur la parcelle 2. Excellente qualité attendue.', planter: { firstName: 'Alassane', lastName: 'Ouattara' } }
  ]
};

const MOCK_STATS = {
  subBuyersCount: 2,
  plantersCount: 42,
  totalQuantityKg: 145000,
  totalValueFCFA: 21750000,
  activeCreditsValueFCFA: 1200000,
  totalRepaymentsValueFCFA: 900000,
  lossRate: 0.8,
  avgMoisture: 7.2
};

const MOCK_OBJECTIVES = [
  { id: 'o1', period: 'MONTHLY', startDate: '2026-07-01', endDate: '2026-07-31', targetQuantityKg: 100000, achievedQuantityKg: 85000, targetValueFCFA: 15000000, achievedValueFCFA: 12750000, targetActivePlanters: 30, achievedActivePlanters: 28, targetNewPlanters: 5, achievedNewPlanters: 4, targetRepaymentFCFA: 1000000, achievedRepaymentFCFA: 900000 }
];

const ZoneManagerDetails = () => {
  const { id } = useParams();
  const { logout, user: authUser } = useAuth();
  const [manager, setManager] = useState(MOCK_MANAGER);
  const [stats, setStats] = useState(MOCK_STATS);
  const [objectives, setObjectives] = useState(MOCK_OBJECTIVES);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Forms states
  const [showObjModal, setShowObjModal] = useState(false);
  const [newObj, setNewObj] = useState({
    period: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    targetQuantityKg: '',
    targetValueFCFA: '',
    targetActivePlanters: '',
    targetNewPlanters: '',
    targetRepaymentFCFA: ''
  });

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [availableZones, setAvailableZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [specialPermission, setSpecialPermission] = useState(false);
  const [notes, setNotes] = useState('');

  const [showSubModal, setShowSubModal] = useState(false);
  const [unassignedSubBuyers, setUnassignedSubBuyers] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const resProfile = await api.get(`/api/v1/zone-managers/${id}`);
      setManager(resProfile.data || MOCK_MANAGER);

      const resStats = await api.get(`/api/v1/zone-managers/${id}/stats`);
      setStats(resStats.data || MOCK_STATS);

      const resObj = await api.get(`/api/v1/zone-managers/${id}/objectives`);
      setObjectives(resObj.data && resObj.data.length > 0 ? resObj.data : MOCK_OBJECTIVES);
    } catch (err) {
      console.warn('[SYS] Échec chargement des données API, utilisation du mock.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableZones = async () => {
    try {
      // Simuler chargement des zones
      const res = await api.get('/api/v1/zones');
      setAvailableZones(res.data || []);
    } catch (err) {
      console.warn('[SYS] Erreur chargement des zones.');
    }
  };

  const fetchUnassignedSubBuyers = async () => {
    try {
      const res = await api.get('/admin/users');
      // Filtrer les pisteurs sans CZ (managerId est null)
      const subBuyers = (res.data || []).filter(u => u.role?.name === 'SOUS_ACHETEUR' && !u.managerId);
      setUnassignedSubBuyers(subBuyers);
    } catch (err) {
      console.warn('[SYS] Erreur chargement pisteurs.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (showZoneModal) fetchAvailableZones();
    if (showSubModal) fetchUnassignedSubBuyers();
  }, [showZoneModal, showSubModal]);

  const handleCreateObjective = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/zone-managers/${id}/objectives`, newObj);
      setShowObjModal(false);
      fetchData();
    } catch (err) {
      alert("Erreur lors de la création de l'objectif : " + (err.response?.data?.message || err.message));
    }
  };

  const handleAssignZone = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/zone-managers/${id}/zones`, {
        zoneId: selectedZoneId,
        specialPermission,
        notes
      });
      setShowZoneModal(false);
      fetchData();
    } catch (err) {
      alert("Erreur lors de l'affectation : " + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveZone = async (zoneId) => {
    if (!confirm("Voulez-vous vraiment retirer cette zone ?")) return;
    try {
      await api.delete(`/api/v1/zone-managers/${id}/zones/${zoneId}`);
      fetchData();
    } catch (err) {
      alert("Erreur lors du retrait de la zone.");
    }
  };

  const handleAttachSub = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/zone-managers/${id}/sub-buyers`, {
        subBuyerId: selectedSubId
      });
      setShowSubModal(false);
      fetchData();
    } catch (err) {
      alert("Erreur lors du rattachement : " + (err.response?.data?.message || err.message));
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
            <Link to="/planters" className="px-3 py-1.5 hover:text-white transition-colors">Planteurs</Link>
            <Link to="/sub-buyers" className="px-3 py-1.5 hover:text-white transition-colors">Sous-acheteurs</Link>
            <Link to="/zone-managers" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Chefs de Zone</Link>
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

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
        <Link to="/zone-managers" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors w-fit">
          <ChevronLeft className="w-4 h-4" /> Retour aux chefs de zone
        </Link>

        {/* CZ Profile Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-lg">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cocoa-600 to-amber-600 flex items-center justify-center text-3xl font-black shadow-md border border-slate-700">
            {manager.user.firstName[0]}{manager.user.lastName[0]}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">{manager.user.firstName} {manager.user.lastName}</h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${manager.status === 'ACTIVE' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-red-950 border-red-800 text-red-400'}`}>
                {manager.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-cocoa-400" /> {manager.user.phone}</span>
              <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-cocoa-400" /> {manager.user.email}</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-cocoa-400" /> Recruté le {new Date(manager.recruitmentDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-slate-800 text-sm">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`pb-4 px-4 font-semibold border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-cocoa-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Indicateurs & Stats
          </button>
          <button 
            onClick={() => setActiveTab('sub-buyers')} 
            className={`pb-4 px-4 font-semibold border-b-2 transition-all ${activeTab === 'sub-buyers' ? 'border-cocoa-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Sous-acheteurs
          </button>
          <button 
            onClick={() => setActiveTab('zones')} 
            className={`pb-4 px-4 font-semibold border-b-2 transition-all ${activeTab === 'zones' ? 'border-cocoa-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Territoires & Zones
          </button>
          <button 
            onClick={() => setActiveTab('visits')} 
            className={`pb-4 px-4 font-semibold border-b-2 transition-all ${activeTab === 'visits' ? 'border-cocoa-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Visites Terrain
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Quick Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-1.5 shadow-md">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Volume Acheté</span>
                <span className="text-2xl font-extrabold text-white">{(stats.totalQuantityKg / 1000).toFixed(1)} Tonnes</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-1.5 shadow-md">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Valeur Achats</span>
                <span className="text-2xl font-extrabold text-white">{stats.totalValueFCFA.toLocaleString()} FCFA</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-1.5 shadow-md">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Crédits Encours</span>
                <span className="text-2xl font-extrabold text-white">{stats.activeCreditsValueFCFA.toLocaleString()} FCFA</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-1.5 shadow-md">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Taux de Perte</span>
                <span className="text-2xl font-extrabold text-white">{stats.lossRate}%</span>
              </div>
            </div>

            {/* Objectives Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cocoa-400" />
                  <h2 className="font-bold text-lg text-slate-200">Suivi des Objectifs</h2>
                </div>
                {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR') && (
                  <button 
                    onClick={() => setShowObjModal(true)}
                    className="text-xs font-semibold px-3 py-1.5 bg-cocoa-600 hover:bg-cocoa-500 rounded-lg text-white transition-all shadow-md"
                  >
                    Définir un Objectif
                  </button>
                )}
              </div>
              <div className="p-6 divide-y divide-slate-800/60">
                {objectives.map(o => {
                  const rateVolume = ((o.achievedQuantityKg / o.targetQuantityKg) * 100).toFixed(0);
                  const rateCredits = ((o.achievedRepaymentFCFA / o.targetRepaymentFCFA) * 100).toFixed(0);
                  return (
                    <div key={o.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-4">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-300">Objectif du {new Date(o.startDate).toLocaleDateString()} au {new Date(o.endDate).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-400">{o.period}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span>Collecte de Cacao ({rateVolume}%)</span>
                            <span>{o.achievedQuantityKg.toLocaleString()} / {o.targetQuantityKg.toLocaleString()} kg</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="bg-cocoa-500 h-full rounded-full transition-all" style={{ width: `${Math.min(parseFloat(rateVolume), 100)}%` }} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs font-semibold text-slate-400">
                            <span>Recouvrement Crédits ({rateCredits}%)</span>
                            <span>{o.achievedRepaymentFCFA.toLocaleString()} / {o.targetRepaymentFCFA.toLocaleString()} FCFA</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${Math.min(parseFloat(rateCredits), 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sub-buyers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cocoa-400" />
                <h2 className="font-bold text-lg text-slate-200">Sous-acheteurs supervisés</h2>
              </div>
              {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR') && (
                <button 
                  onClick={() => setShowSubModal(true)}
                  className="text-xs font-semibold px-3 py-1.5 bg-cocoa-600 hover:bg-cocoa-500 rounded-lg text-white transition-all shadow-md"
                >
                  Rattacher un Pisteur
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Pisteur</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 text-right">Fiche</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {manager.user.subordinates.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-200">{s.firstName} {s.lastName}</td>
                      <td className="px-6 py-4 text-slate-400">{s.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/sub-buyers/${s.id}`} 
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold shadow"
                        >
                          Détails
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'zones' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cocoa-400" />
                <h2 className="font-bold text-lg text-slate-200">Zones Géographiques Affectées</h2>
              </div>
              {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR') && (
                <button 
                  onClick={() => setShowZoneModal(true)}
                  className="text-xs font-semibold px-3 py-1.5 bg-cocoa-600 hover:bg-cocoa-500 rounded-lg text-white transition-all shadow-md"
                >
                  Affecter une Zone
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Nom Zone</th>
                    <th className="px-6 py-4">Niveau</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {manager.zones.map(z => (
                    <tr key={z.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-200">{z.name}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{z.level}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{z.code}</td>
                      <td className="px-6 py-4 text-right">
                        {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR') && (
                          <button 
                            onClick={() => handleRemoveZone(z.id)}
                            className="px-3 py-1 bg-red-950/80 border border-red-900/60 hover:bg-red-900 rounded-lg text-xs font-semibold text-red-400 hover:text-white"
                          >
                            Retirer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cocoa-400" />
                <h2 className="font-bold text-lg text-slate-200">Suivi des visites terrain (Planteurs)</h2>
              </div>
            </div>
            <div className="relative border-l border-slate-800 pl-6 ml-4 flex flex-col gap-6">
              {manager.planterVisits.map(v => (
                <div key={v.id} className="relative">
                  <div className="absolute -left-9 top-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-cocoa-600 flex items-center justify-center text-[10px] text-cocoa-400">
                    ✓
                  </div>
                  <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Planteur : {v.planter.firstName} {v.planter.lastName}</span>
                      <span className="text-slate-500">{new Date(v.visitDate).toLocaleDateString()}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 w-fit text-slate-400 font-mono uppercase">{v.purpose}</span>
                    <p className="text-slate-400 text-sm">{v.comments}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Objective */}
      {showObjModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">Définir un Objectif</h2>
              <button onClick={() => setShowObjModal(false)} className="text-slate-400 hover:text-white font-semibold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateObjective} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Période</label>
                  <select 
                    value={newObj.period} 
                    onChange={(e) => setNewObj({...newObj, period: e.target.value})}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                  >
                    <option value="DAILY">Journalier</option>
                    <option value="WEEKLY">Hebdomadaire</option>
                    <option value="MONTHLY">Mensuel</option>
                    <option value="ANNUAL">Annuel</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Volume Cible (kg)</label>
                  <input 
                    type="number" 
                    value={newObj.targetQuantityKg} 
                    onChange={(e) => setNewObj({...newObj, targetQuantityKg: e.target.value})}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Date début</label>
                  <input 
                    type="date" 
                    value={newObj.startDate} 
                    onChange={(e) => setNewObj({...newObj, startDate: e.target.value})}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Date fin</label>
                  <input 
                    type="date" 
                    value={newObj.endDate} 
                    onChange={(e) => setNewObj({...newObj, endDate: e.target.value})}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Cible de Recouvrement (FCFA)</label>
                <input 
                  type="number" 
                  value={newObj.targetRepaymentFCFA} 
                  onChange={(e) => setNewObj({...newObj, targetRepaymentFCFA: e.target.value})}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowObjModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-cocoa-600 hover:bg-cocoa-500 rounded-xl font-semibold text-sm">Définir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zone Affectation */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">Affecter une Zone Géographique</h2>
              <button onClick={() => setShowZoneModal(false)} className="text-slate-400 hover:text-white font-semibold text-lg">&times;</button>
            </div>
            <form onSubmit={handleAssignZone} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Sélectionner la Zone</label>
                <select 
                  value={selectedZoneId} 
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                  required
                >
                  <option value="">-- Choisir une zone --</option>
                  {availableZones.map(z => (
                    <option key={z.id} value={z.id}>{z.name} ({z.level})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="special"
                  checked={specialPermission}
                  onChange={(e) => setSpecialPermission(e.target.checked)}
                  className="bg-slate-950 border border-slate-800 rounded focus:ring-cocoa-500"
                />
                <label htmlFor="special" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Dérogations Spéciale (Autoriser le chevauchement)
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Notes / Justification</label>
                <textarea 
                  rows="3" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowZoneModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-cocoa-600 hover:bg-cocoa-500 rounded-xl font-semibold text-sm">Affecter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal SubBuyer Attachment */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">Rattacher un Sous-acheteur</h2>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-white font-semibold text-lg">&times;</button>
            </div>
            <form onSubmit={handleAttachSub} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Sélectionner le Pisteur</label>
                <select 
                  value={selectedSubId} 
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                  required
                >
                  <option value="">-- Choisir un sous-acheteur --</option>
                  {unassignedSubBuyers.map(sb => (
                    <option key={sb.id} value={sb.id}>{sb.firstName} {sb.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={() => setShowSubModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-sm">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-cocoa-600 hover:bg-cocoa-500 rounded-xl font-semibold text-sm">Rattacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneManagerDetails;

import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, Eye, LogOut, Sparkles, Map, Award, TrendingUp, Users } from 'lucide-react';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const MOCK_MANAGERS = [
  { id: 'm1', fullName: 'Jean Marcel Essono', user: { firstName: 'Jean Marcel', lastName: 'Essono', email: 'essonojeanmarcel@gmail.com', phone: '+237699999901' }, performanceScore: 92.5, metrics: { totalQuantityKg: 145000.0, averageMoisture: 7.2, repaymentRate: 95.0, lossPercentage: 0.8, newPlantersCount: 14, deliveriesCount: 18 }, subScores: { volume: 95, quality: 90, repayment: 95, recruitment: 90, regularity: 95 } },
  { id: 'm2', fullName: 'Alassane Touré', user: { firstName: 'Alassane', lastName: 'Touré', email: 'a.toure@agriflow.com', phone: '+2250707070801' }, performanceScore: 84.2, metrics: { totalQuantityKg: 98000.0, averageMoisture: 7.4, repaymentRate: 88.0, lossPercentage: 1.2, newPlantersCount: 8, deliveriesCount: 12 }, subScores: { volume: 82, quality: 85, repayment: 88, recruitment: 80, regularity: 85 } },
  { id: 'm3', fullName: 'Koffi Yao', user: { firstName: 'Koffi', lastName: 'Yao', email: 'k.yao@agriflow.com', phone: '+2250707070802' }, performanceScore: 75.1, metrics: { totalQuantityKg: 112000.0, averageMoisture: 7.8, repaymentRate: 82.5, lossPercentage: 1.5, newPlantersCount: 9, deliveriesCount: 8 }, subScores: { volume: 75, quality: 70, repayment: 82, recruitment: 80, regularity: 70 } }
];

const ZoneManagersList = () => {
  const { logout, user: authUser } = useAuth();
  const navigate = useNavigate();

  const [managers, setManagers] = useState(MOCK_MANAGERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create CZ State
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [gender, setGender] = useState('M');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [recruitmentDate, setRecruitmentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleRowClick = (id) => {
    navigate(`/zone-managers/${id}`);
  };

  const fetchManagers = async () => {
    setLoading(true);
    try {
      // Tenter de recuperer le classement des performances
      const res = await api.get('/api/v1/zone-managers/performance/leaderboard');
      setManagers(res.data && res.data.length > 0 ? res.data : (USE_MOCKS ? MOCK_MANAGERS : []));
    } catch (err) {
      if (USE_MOCKS) {
        console.warn('[SYS] Échec chargement API leaderboard, utilisation du mock.');
        setManagers(MOCK_MANAGERS);
      } else {
        console.error('[SYS] Erreur API leaderboard:', err);
        setManagers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Lister les utilisateurs pour trouver ceux qui ont le role CHEF_DE_ZONE
      const res = await api.get('/admin/users');
      const czUsers = (res.data || []).filter(u => u.role?.name === 'CHEF_DE_ZONE');
      setAvailableUsers(czUsers);
    } catch (err) {
      console.warn('[SYS] Échec chargement utilisateurs.');
    }
  };

  useEffect(() => {
    fetchManagers();
    fetchAvailableUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await api.post('/api/v1/zone-managers', {
        userId: selectedUserId,
        gender,
        phoneSecondary,
        recruitmentDate
      });
      setShowCreateModal(false);
      fetchManagers();
    } catch (err) {
      alert("Erreur lors de la création du profil : " + (err.response?.data?.message || err.message));
    }
  };

  const getRoleBadge = () => {
    return authUser?.role?.name || 'Collaborateur';
  };

  const filteredManagers = managers.filter(m => 
    m.fullName.toLowerCase().includes(search.toLowerCase()) || 
    m.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.phone?.includes(search)
  );

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
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Gestion des Chefs de Zone
            </h1>
            <p className="text-slate-400 mt-1">Supervisez la hiérarchie géographique, les objectifs et la performance des territoires.</p>
          </div>
          {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR') && (
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-cocoa-600 hover:bg-cocoa-500 active:bg-cocoa-700 rounded-xl font-semibold shadow-lg shadow-cocoa-900/20 transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              Nouveau Chef de Zone
            </button>
          )}
        </div>

        {/* Leaderboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredManagers.slice(0, 3).map((m, i) => {
            const scoreColor = m.performanceScore >= 85 ? 'text-emerald-400' : m.performanceScore >= 70 ? 'text-amber-400' : 'text-red-400';
            return (
              <div key={m.id} className="relative bg-slate-900 border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 overflow-hidden group hover:border-slate-700 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cocoa-500/10 to-indigo-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cocoa-600 to-amber-600 flex items-center justify-center font-bold text-lg">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 group-hover:text-cocoa-400 transition-colors">{m.fullName}</h3>
                      <p className="text-xs text-slate-400">{m.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Score SPG</span>
                    <span className={`text-2xl font-black ${scoreColor}`}>{m.performanceScore}%</span>
                  </div>
                </div>
                <div className="border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-[11px]">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Volume Cacao</span>
                    <span className="font-semibold text-slate-300">{(m.metrics?.totalQuantityKg / 1000).toFixed(1)} Tonnes</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Recouvrement</span>
                    <span className="font-semibold text-slate-300">{m.metrics?.repaymentRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Recrutement</span>
                    <span className="font-semibold text-slate-300">{m.metrics?.newPlantersCount || 0} Planteurs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Régularité</span>
                    <span className="font-semibold text-slate-300">{m.metrics?.deliveriesCount || 0} Livraisons</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex gap-4 items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, email ou téléphone..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cocoa-500/80 focus:ring-1 focus:ring-cocoa-500/20 transition-all"
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cocoa-400" />
              <h2 className="font-bold text-lg text-slate-200">Classement de Performance Générale</h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-400">
              Mise à jour en temps réel
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Rang</th>
                  <th className="px-6 py-4">Chef de Zone</th>
                  <th className="px-6 py-4">Volume (Kg)</th>
                  <th className="px-6 py-4">H2O moyenne</th>
                  <th className="px-6 py-4">Recouvrement</th>
                  <th className="px-6 py-4">Recrutement</th>
                  <th className="px-6 py-4">Régularité</th>
                  <th className="px-6 py-4">Score SPG</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {filteredManagers.map((m, index) => {
                  const scoreColor = m.performanceScore >= 85 ? 'text-emerald-400' : m.performanceScore >= 70 ? 'text-amber-400' : 'text-red-400';
                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => handleRowClick(m.id)}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-bold text-slate-400 group-hover:text-white transition-colors">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200 group-hover:text-cocoa-400 transition-colors">
                          {m.fullName}
                        </div>
                        <div className="text-xs text-slate-500">{m.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono font-medium">{(m.metrics?.totalQuantityKg || 0).toLocaleString()} kg</td>
                      <td className="px-6 py-4 text-slate-300">{m.metrics?.averageMoisture || 7.5}%</td>
                      <td className="px-6 py-4 text-slate-300">{m.metrics?.repaymentRate || 100}%</td>
                      <td className="px-6 py-4 text-slate-300">{m.metrics?.newPlantersCount || 0} rec.</td>
                      <td className="px-6 py-4 text-slate-300">{m.metrics?.deliveriesCount || 0} liv.</td>
                      <td className="px-6 py-4">
                        <span className={`font-black ${scoreColor}`}>{m.performanceScore}%</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRowClick(m.id); }}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Creation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">Créer un Profil Chef de Zone</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-semibold text-lg"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Sélectionner le Collaborateur</label>
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                  required
                >
                  <option value="">-- Choisir un utilisateur --</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Genre</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                  >
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Recrutement</label>
                  <input 
                    type="date" 
                    value={recruitmentDate} 
                    onChange={(e) => setRecruitmentDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Téléphone Secondaire (optionnel)</label>
                <input 
                  type="text" 
                  placeholder="ex: +225..." 
                  value={phoneSecondary} 
                  onChange={(e) => setPhoneSecondary(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cocoa-500 text-slate-200 text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-sm transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2.5 bg-cocoa-600 hover:bg-cocoa-500 rounded-xl font-semibold text-sm transition-colors"
                >
                  Créer le profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneManagersList;

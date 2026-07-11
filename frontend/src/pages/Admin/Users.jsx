import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Search, UserPlus, SlidersHorizontal, Edit3, Trash2, ShieldAlert, CheckCircle2, XCircle, LogOut } from 'lucide-react';

const MOCK_ROLES = [
  { id: '1', name: 'Administrateur' },
  { id: '2', name: 'Directeur général' },
  { id: '3', name: 'Comptable' },
  { id: '4', name: 'Caissier' },
  { id: '5', name: 'Magasinier' },
];

const MOCK_USERS = [
  { id: 'u1', firstName: 'Jean', lastName: 'Dupont', email: 'j.dupont@agriflow.com', phone: '+237699999999', jobTitle: 'Comptable Central', role: { name: 'Comptable' }, store: { name: 'Magasin Douala' }, status: 'ACTIVE', createdAt: '2026-06-15T08:00:00Z' },
  { id: 'u2', firstName: 'Marie', lastName: 'Koffi', email: 'm.koffi@agriflow.com', phone: '+2250707070707', jobTitle: 'Magasinière Principale', role: { name: 'Magasinier' }, store: { name: 'Coopérative Soubré' }, status: 'ACTIVE', createdAt: '2026-07-01T10:30:00Z' },
  { id: 'u3', firstName: 'Paul', lastName: 'Biya', email: 'p.biya@agriflow.com', phone: '+237677777777', jobTitle: 'Caissier Campagne', role: { name: 'Caissier' }, store: { name: 'Bureau Yaoundé' }, status: 'SUSPENDED', createdAt: '2026-05-10T14:15:00Z' },
];

const Users = () => {
  const { logout, user: authUser } = useAuth();
  
  const [users, setUsers] = useState(MOCK_USERS);
  const [total, setTotal] = useState(MOCK_USERS.length);
  const [loading, setLoading] = useState(false);

  // States de filtrage et recherche
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // States Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  
  // Champs Formulaire
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    role_id: '1',
    store_id: '',
    manager_id: '',
    hire_date: '',
    status: 'ACTIVE',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/users', { params });
      setUsers(res.data.users || MOCK_USERS);
      setTotal(res.data.total || MOCK_USERS.length);
    } catch (err) {
      console.warn('[SYS] Échec chargement API backend, utilisation des données simulées (mock).');
      // Filtrage local en cas d'absence de backend
      let localUsers = MOCK_USERS.filter(u => {
        const matchesSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !roleFilter || u.role.name === roleFilter;
        const matchesStatus = !statusFilter || u.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      });
      setUsers(localUsers);
      setTotal(localUsers.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const openCreateModal = () => {
    setEditMode(false);
    setTargetUser(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      role_id: '1',
      store_id: '',
      manager_id: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditMode(true);
    setTargetUser(user);
    setFormData({
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email || '',
      phone: user.phone || '',
      job_title: user.jobTitle || '',
      role_id: user.roleId || '1',
      store_id: user.storeId || '',
      manager_id: user.managerId || '',
      hire_date: user.hireDate ? user.hireDate.split('T')[0] : '',
      status: user.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode && targetUser) {
        await api.put(`/users/${targetUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Erreur de sauvegarde', err);
      // Simulation locale pour le test hors-ligne
      if (editMode && targetUser) {
        setUsers(users.map(u => u.id === targetUser.id ? { ...u, firstName: formData.first_name, lastName: formData.last_name, email: formData.email, phone: formData.phone, jobTitle: formData.job_title, status: formData.status } : u));
      } else {
        const newUser = {
          id: 'u_' + Date.now(),
          firstName: formData.first_name,
          lastName: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          jobTitle: formData.job_title,
          role: { name: 'Comptable' },
          store: { name: 'Magasin Central' },
          status: formData.status,
          createdAt: new Date().toISOString(),
        };
        setUsers([newUser, ...users]);
      }
      setModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Navbar Premium */}
      <header className="px-8 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-white">AgriFlow <span className="text-cocoa-400 font-medium">ERP</span></span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-400 font-medium">Portail Admin</span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-400 mr-2">
            <a href="/dashboard" className="px-3 py-1.5 hover:text-white transition-colors">Tableau de bord</a>
            <a href="/planters" className="px-3 py-1.5 hover:text-white transition-colors">Planteurs</a>
            <a href="/admin/users" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Collaborateurs</a>
            <a href="/admin/permissions" className="px-3 py-1.5 hover:text-white transition-colors">Permissions</a>
          </nav>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cocoa-600 flex items-center justify-center font-bold text-white text-sm">
                {authUser?.firstName?.[0] || 'U'}{authUser?.lastName?.[0] || 'S'}
              </div>
              <span className="text-sm font-semibold text-slate-200">{authUser?.firstName || 'Utilisateur'}</span>
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
            <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
            <p className="text-slate-400 text-sm">Gérez les comptes des collaborateurs, leurs affectations et leurs accès.</p>
          </div>
          <div className="flex gap-3">
            <a href="/admin/permissions" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-medium transition-colors">
              Matrice de Permissions
            </a>
            <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-cocoa-600 hover:bg-cocoa-500 rounded-xl text-sm font-bold shadow-lg shadow-cocoa-600/10 transition-colors">
              <UserPlus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {/* Filtres et Barre de recherche */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, e-mail, fonction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800/80 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:border-cocoa-500 transition-colors text-sm"
            />
          </div>

          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex-1 md:w-48 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-cocoa-500 transition-colors"
            >
              <option value="">Tous les rôles</option>
              {MOCK_ROLES.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:w-48 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-cocoa-500 transition-colors"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="DEACTIVATED">Désactivé</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Affectation</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Créé le</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Chargement...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Aucun utilisateur trouvé.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cocoa-400 uppercase">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-slate-400">{u.email || u.phone}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium">
                          {u.role.name}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        {u.store?.name || 'Non affecté'}
                      </td>
                      <td className="p-4">
                        {u.status === 'ACTIVE' ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Actif
                          </span>
                        ) : u.status === 'SUSPENDED' ? (
                          <span className="flex items-center gap-1.5 text-yellow-500 text-xs font-medium">
                            <ShieldAlert className="w-4 h-4" /> Suspendu
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
                            <XCircle className="w-4 h-4" /> Désactivé
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openEditModal(u)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Créer/Modifier (Tiroir) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade">
          <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-8 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">{editMode ? "Modifier l'utilisateur" : "Ajouter un collaborateur"}</h3>
                <p className="text-slate-400 text-xs mt-1">Saisissez les informations de profil et d'organisation.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Prénom</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Nom</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Téléphone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Rôle</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {MOCK_ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Intitulé de poste</label>
                  <input
                    type="text"
                    required
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="SUSPENDED">Suspendu</option>
                    <option value="DEACTIVATED">Désactivé</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 rounded-lg text-sm font-semibold">
                    Annuler
                  </button>
                  <button type="submit" className="flex-1 py-2 bg-cocoa-600 hover:bg-cocoa-500 rounded-lg text-sm font-bold">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

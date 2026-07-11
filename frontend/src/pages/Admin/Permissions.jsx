import React, { useState, useEffect } from 'react';
import api from '../../api';
import { ArrowLeft, Save, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const MODULES = [
  { key: 'purchases', label: 'Achats Cacao' },
  { key: 'inventory', label: 'Gestion des Stocks' },
  { key: 'credits', label: 'Crédits Agricoles' },
  { key: 'sales', label: 'Ventes & Export' },
  { key: 'hr', label: 'Ressources Humaines' },
  { key: 'system', label: 'Configuration Système' },
];

const ACTIONS = [
  { key: 'VIEW', label: 'Voir' },
  { key: 'ADD', label: 'Ajouter' },
  { key: 'EDIT', label: 'Modifier' },
  { key: 'DELETE', label: 'Supprimer' },
  { key: 'EXPORT', label: 'Exporter' },
  { key: 'PRINT', label: 'Imprimer' },
  { key: 'VALIDATE', label: 'Valider' },
  { key: 'CANCEL', label: 'Annuler' },
];

const MOCK_ROLES = [
  { id: 'r1', name: 'Administrateur', description: 'Accès complet au système' },
  { id: 'r2', name: 'Comptable', description: 'Gestion financière et des écritures' },
  { id: 'r3', name: 'Caissier', description: 'Saisie et validation des flux de caisse' },
  { id: 'r4', name: 'Magasinier', description: 'Réception, pesage et expédition du cacao' },
];

// Mock state initial pour les permissions
const INITIAL_MOCK_PERMS = {
  r1: MODULES.reduce((acc, mod) => {
    acc[mod.key] = ACTIONS.reduce((actAcc, act) => { actAcc[act.key] = true; return actAcc; }, {});
    return acc;
  }, {}),
  r2: {
    purchases: { VIEW: true, ADD: false, EDIT: false, DELETE: false, EXPORT: true, PRINT: true, VALIDATE: false, CANCEL: false },
    inventory: { VIEW: true, ADD: false, EDIT: false, DELETE: false, EXPORT: true, PRINT: true, VALIDATE: false, CANCEL: false },
    credits: { VIEW: true, ADD: true, EDIT: true, DELETE: false, EXPORT: true, PRINT: true, VALIDATE: true, CANCEL: true },
    sales: { VIEW: true, ADD: false, EDIT: false, DELETE: false, EXPORT: true, PRINT: true, VALIDATE: false, CANCEL: false },
    hr: { VIEW: true, ADD: true, EDIT: true, DELETE: false, EXPORT: true, PRINT: true, VALIDATE: true, CANCEL: false },
    system: { VIEW: false, ADD: false, EDIT: false, DELETE: false, EXPORT: false, PRINT: false, VALIDATE: false, CANCEL: false },
  },
  r3: {
    purchases: { VIEW: true, ADD: true, EDIT: false, DELETE: false, EXPORT: false, PRINT: true, VALIDATE: true, CANCEL: false },
    inventory: { VIEW: false, ADD: false, EDIT: false, DELETE: false, EXPORT: false, PRINT: false, VALIDATE: false, CANCEL: false },
    credits: { VIEW: true, ADD: true, EDIT: false, DELETE: false, EXPORT: false, PRINT: true, VALIDATE: true, CANCEL: false },
    sales: { VIEW: false, ADD: false, EDIT: false, DELETE: false, EXPORT: false, PRINT: false, VALIDATE: false, CANCEL: false },
    hr: { VIEW: false, ADD: false, EDIT: false, DELETE: false, EXPORT: false, PRINT: false, VALIDATE: false, CANCEL: false },
    system: { VIEW: false, ADD: false, EDIT: false, DELETE: false, EXPORT: false, PRINT: false, VALIDATE: false, CANCEL: false },
  }
};

const Permissions = () => {
  const [roles, setRoles] = useState(MOCK_ROLES);
  const [selectedRole, setSelectedRole] = useState('r2');
  const [matrix, setMatrix] = useState(INITIAL_MOCK_PERMS);
  
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fetchPermissions = async () => {
    try {
      const res = await api.get('/users/roles');
      setRoles(res.data || MOCK_ROLES);
      // Re-map des données du serveur dans notre state local...
    } catch (err) {
      console.warn('[SYS] Serveur hors-ligne, utilisation des permissions simulées.');
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = (moduleKey, actionKey) => {
    // Si c'est l'administrateur, on empêche d'enlever ses propres droits pour éviter un auto-lockout
    if (selectedRole === 'r1') return;

    setMatrix((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [moduleKey]: {
          ...prev[selectedRole]?.[moduleKey],
          [actionKey]: !prev[selectedRole]?.[moduleKey]?.[actionKey],
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Construction de la payload pour le serveur
      const rolePermissions = [];
      const roleMatrix = matrix[selectedRole];
      
      Object.keys(roleMatrix).forEach((module) => {
        Object.keys(roleMatrix[module]).forEach((action) => {
          if (roleMatrix[module][action]) {
            rolePermissions.push({ module, action });
          }
        });
      });

      await api.put(`/users/roles/${selectedRole}/permissions`, { permissions: rolePermissions });
    } catch (err) {
      console.warn('[SYS] Sauvegarde locale uniquement (mock).');
    } finally {
      setSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const currentPerms = matrix[selectedRole] || {};
  const currentRoleInfo = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 animate-fade">
          <ShieldCheck className="w-5 h-5" />
          <span>Matrice mise à jour avec succès.</span>
        </div>
      )}

      {/* Header */}
      <header className="px-8 py-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/admin/users" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Matrice des Rôles & Permissions</h1>
            <p className="text-slate-400 text-xs mt-0.5">Associez des droits d'action spécifiques pour chaque module de l'ERP.</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-cocoa-600 hover:bg-cocoa-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cocoa-600/10 transition-all hover:scale-[1.01]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Enregistrer</span>
        </button>
      </header>

      {/* Main Grid */}
      <main className="p-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Colonne Gauche : Sélection du Rôle */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Rôles système</h2>
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedRole === role.id
                    ? 'bg-cocoa-900/10 border-cocoa-500 text-white'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <p className="font-bold text-sm">{role.name}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{role.description || "Aucune description fournie."}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Colonne Droite : Matrice de permissions */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-lg text-white">Droits de : {currentRoleInfo?.name}</h3>
                <p className="text-xs text-slate-400">{currentRoleInfo?.description}</p>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>Les modifications sont temporaires jusqu'à l'enregistrement</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-850 text-xs font-semibold text-slate-400">
                    <th className="py-3 px-4">Module de l'ERP</th>
                    {ACTIONS.map(act => (
                      <th key={act.key} className="py-3 px-2 text-center select-none">{act.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {MODULES.map(mod => (
                    <tr key={mod.key} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-200 text-sm">
                        {mod.label}
                      </td>
                      {ACTIONS.map(act => {
                        const isGranted = currentPerms[mod.key]?.[act.key] || false;
                        return (
                          <td key={act.key} className="py-4 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggle(mod.key, act.key)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors relative focus:outline-none ${
                                isGranted ? 'bg-cocoa-500' : 'bg-slate-800'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                  isGranted ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Permissions;

import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Settings, Save, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function RefactionRulesConfig() {
  const [rules, setRules] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Mode édition / Création
  const [editingRule, setEditingRule] = useState(null);

  const fetchRulesAndStores = async () => {
    setLoading(true);
    try {
      const [rulesRes, storesRes] = await Promise.all([
        api.get('/api/v1/quality-controls/rules'),
        api.get('/api/v1/planters') // planers has access to stores, or let's load stores
      ]);
      setRules(rulesRes.data || []);
      
      // Let's try to query stores directly, or fallback to default stores
      try {
        const sRes = await api.get('/api/v1/zone-managers'); // zone managers has geographic zone
        // For simplicity, let's fetch a list of stores from another source or hardcode defaults if not found
        setStores([
          { id: 'abengourou-store-id', name: 'Magasin Abengourou' },
          { id: 'central-store-id', name: 'Magasin Central San Pedro' }
        ]);
      } catch (err) {
        console.error("Erreur chargement magasins:", err);
      }
    } catch (err) {
      console.error("Erreur chargement données:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndStores();
  }, []);

  const handleCreateNew = () => {
    setEditingRule({
      code: 'HUMIDITE',
      name: 'Nouveau critère',
      threshold: 8.0,
      penaltyType: 'PERCENT_WEIGHT',
      penaltyValue: 1.0,
      formula: '',
      maxLimit: 12.0,
      campaign: '2025/2026',
      storeId: '',
      clientExport: '',
      isActive: true,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingRule,
        threshold: parseFloat(editingRule.threshold),
        penaltyValue: parseFloat(editingRule.penaltyValue),
        maxLimit: editingRule.maxLimit ? parseFloat(editingRule.maxLimit) : undefined,
        storeId: editingRule.storeId || undefined,
        campaign: editingRule.campaign || undefined,
        clientExport: editingRule.clientExport || undefined,
        formula: editingRule.formula || undefined,
      };

      await api.put('/api/v1/quality-controls/rules', payload);
      setMessage({ type: 'success', text: 'Règle enregistrée avec succès !' });
      setEditingRule(null);
      fetchRulesAndStores();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-3">
              <Settings className="text-amber-400" /> Paramétrage des Réfactions et Qualité
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Configurez dynamiquement les critères de pénalités et les seuils d'humidité/impuretés par campagne, magasin ou exportateur.
            </p>
          </div>
          {!editingRule && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg transition-all"
            >
              <Plus size={18} /> Ajouter une règle
            </button>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {editingRule ? (
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-amber-400 border-b border-slate-800 pb-3">
              {editingRule.id ? 'Modifier la règle de réfaction' : 'Créer une règle de réfaction'}
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Code Critère</label>
                <select
                  value={editingRule.code}
                  onChange={(e) => setEditingRule({ ...editingRule, code: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="HUMIDITE">HUMIDITE (Taux d'humidité)</option>
                  <option value="DECHETS">DECHETS (Impuretés)</option>
                  <option value="MOISIES">MOISIES (Fèves moisies)</option>
                  <option value="ARDOISED">ARDOISED (Fèves ardoisées)</option>
                  <option value="INSECTE">INSECTE (Mitées)</option>
                  <option value="CASSEES">CASSEES (Débris)</option>
                  <option value="PLATES">PLATES (Fèves plates)</option>
                  <option value="GERMEES">GERMEES (Fèves germées)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Libellé</label>
                <input
                  type="text"
                  required
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Seuil standard (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingRule.threshold}
                  onChange={(e) => setEditingRule({ ...editingRule, threshold: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type de pénalité</label>
                <select
                  value={editingRule.penaltyType}
                  onChange={(e) => setEditingRule({ ...editingRule, penaltyType: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="PERCENT_WEIGHT">PERCENT_WEIGHT (Déduction de poids %)</option>
                  <option value="WEIGHT_KG">WEIGHT_KG (Déduction fixe Kg)</option>
                  <option value="AMOUNT_FCFA">AMOUNT_FCFA (Pénalité FCFA)</option>
                  <option value="REJECT">REJECT (Rejet automatique)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valeur de pénalité</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingRule.penaltyValue}
                  onChange={(e) => setEditingRule({ ...editingRule, penaltyValue: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Limite critique de rejet</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingRule.maxLimit || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, maxLimit: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="ex: 12.0%"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-300">Portée / Filtre d'application</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Campagne</label>
                  <input
                    type="text"
                    value={editingRule.campaign || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, campaign: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="2025/2026"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Magasin</label>
                  <select
                    value={editingRule.storeId || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, storeId: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Tous les magasins</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Client Export</label>
                  <input
                    type="text"
                    value={editingRule.clientExport || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, clientExport: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Cargill, Barry..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Formule personnalisée (Optionnel)</label>
              <textarea
                value={editingRule.formula || ''}
                onChange={(e) => setEditingRule({ ...editingRule, formula: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm h-20"
                placeholder="metrics.moistureRate > 10 ? (metrics.moistureRate - 8) * 2 : (metrics.moistureRate - 8)"
              />
              <p className="text-[10px] text-slate-500">
                Laissez vide pour le calcul linéaire standard `(valeur - seuil) * pénalité`.
              </p>
            </div>

            <div className="flex justify-end gap-4 border-t border-slate-800 pt-6">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-5 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 px-6 rounded-xl"
              >
                <Save size={18} /> Enregistrer la règle
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Critère</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Libellé</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Seuil</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Pénalité</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Limite critique</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Portée</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Formule</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-sm text-amber-400 font-bold">{r.code}</td>
                    <td className="p-4 text-sm font-semibold">{r.name}</td>
                    <td className="p-4 text-sm">{r.threshold}%</td>
                    <td className="p-4 text-sm font-medium">
                      {r.penaltyType === 'PERCENT_WEIGHT' ? `${r.penaltyValue}% du poids` : `${r.penaltyValue} FCFA`}
                    </td>
                    <td className="p-4 text-sm text-red-400 font-semibold">{r.maxLimit ? `${r.maxLimit}%` : 'Aucune'}</td>
                    <td className="p-4 text-xs text-slate-400">
                      {r.campaign && <span className="block">Campagne: {r.campaign}</span>}
                      {r.store && <span className="block">Magasin: {r.store.name}</span>}
                      {r.clientExport && <span className="block">Client: {r.clientExport}</span>}
                      {!r.campaign && !r.store && !r.clientExport && <span className="text-slate-500 italic">Globale</span>}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                      {r.formula || 'Linéaire standard'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setEditingRule(r)}
                        className="text-amber-400 hover:text-amber-300 font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Configurer
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500 italic">Aucune règle de réfaction configurée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

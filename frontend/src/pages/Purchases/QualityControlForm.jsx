import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Award, Save, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function QualityControlForm() {
  const { purchaseId } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [form, setForm] = useState({
    moistureRate: 7.5,
    impurityRate: 0.5,
    moldyRate: 1.0,
    slatyRate: 1.0,
    insectRate: 0.0,
    brokenRate: 1.0,
    flatRate: 0.5,
    germinatedRate: 0.0,
    grainage: 95,
    wetBagsCount: 0,
    smell: 'CONFORME',
    color: 'CONFORME',
    bagCondition: 'PROPRE',
    observations: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (purchaseId && isOnline) {
      api.get(`/api/v1/purchases/${purchaseId}`)
        .then(res => setPurchase(res.data))
        .catch(err => console.error("Erreur chargement achat:", err));
    }
  }, [purchaseId, isOnline]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      purchaseId: purchaseId,
      moistureRate: parseFloat(form.moistureRate),
      impurityRate: parseFloat(form.impurityRate),
      moldyRate: parseFloat(form.moldyRate),
      slatyRate: parseFloat(form.slatyRate),
      insectRate: parseFloat(form.insectRate),
      brokenRate: parseFloat(form.brokenRate),
      flatRate: parseFloat(form.flatRate),
      germinatedRate: parseFloat(form.germinatedRate),
      grainage: parseInt(form.grainage),
      wetBagsCount: parseInt(form.wetBagsCount),
      smell: form.smell,
      color: form.color,
      bagCondition: form.bagCondition,
      observations: form.observations,
    };

    if (!isOnline) {
      // Stockage hors-ligne
      try {
        const offlineQCs = JSON.parse(localStorage.getItem('offline_quality_controls') || '[]');
        offlineQCs.push({
          ...payload,
          id: `offline-${Date.now()}`,
          purchaseNumber: purchase?.purchaseNumber || 'ACH-OFFLINE',
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('offline_quality_controls', JSON.stringify(offlineQCs));
        alert("Contrôle qualité enregistré localement (Hors ligne). Il sera synchronisé dès le retour du réseau.");
        navigate('/purchases');
      } catch (err) {
        setError("Erreur lors de l'enregistrement local hors-ligne.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      await api.post('/api/v1/quality-controls', payload);
      alert("Contrôle qualité enregistré avec succès !");
      navigate('/purchases');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du contrôle qualité');
    } finally {
      setLoading(false);
    }
  };

  // Helper pour obtenir la couleur de retour dynamique
  const getHumidityColor = (val) => {
    if (val <= 8.0) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (val <= 10.0) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  const getImpurityColor = (val) => {
    if (val <= 1.0) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (val <= 2.0) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 flex items-center gap-3">
              <Award className="text-teal-400" /> Saisie du Contrôle Qualité
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Enregistrez les résultats des analyses physiques pour l'achat {purchase?.purchaseNumber || '...'}
            </p>
          </div>
          <div>
            {isOnline ? (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold">
                <Wifi size={14} /> En Ligne
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-semibold">
                <WifiOff size={14} /> Hors Ligne
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-2">
            <ShieldAlert size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Mesures physiques */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">Analyses Physiques</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className={`flex flex-col gap-2 p-4 border rounded-xl transition-colors ${getHumidityColor(form.moistureRate)}`}>
                <label className="text-xs font-bold uppercase tracking-wider">Taux d'Humidité (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.moistureRate}
                  onChange={(e) => setForm({ ...form, moistureRate: e.target.value })}
                  className="bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-200"
                />
                <span className="text-[10px] opacity-80">Standard: &lt;= 8.0%. Alerte si &gt; 10%</span>
              </div>

              <div className={`flex flex-col gap-2 p-4 border rounded-xl transition-colors ${getImpurityColor(form.impurityRate)}`}>
                <label className="text-xs font-bold uppercase tracking-wider">Taux de Déchets (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.impurityRate}
                  onChange={(e) => setForm({ ...form, impurityRate: e.target.value })}
                  className="bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-200"
                />
                <span className="text-[10px] opacity-80">Standard: &lt;= 1.0%. Rejet si &gt; 5%</span>
              </div>

              <div className="flex flex-col gap-2 p-4 border border-slate-800 bg-slate-950/20 rounded-xl">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grainage (Fèves/100g)</label>
                <input
                  type="number"
                  required
                  value={form.grainage}
                  onChange={(e) => setForm({ ...form, grainage: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-200"
                />
                <span className="text-[10px] text-slate-500">Qualité supérieure: &lt; 100 fèves</span>
              </div>

            </div>
          </div>

          {/* Section 2: Fèves défectueuses cut test */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">Coupe Physique (Cut Test - %)</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Moisies</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.moldyRate}
                  onChange={(e) => setForm({ ...form, moldyRate: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Ardoisées</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.slatyRate}
                  onChange={(e) => setForm({ ...form, slatyRate: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Mitées / Insectes</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.insectRate}
                  onChange={(e) => setForm({ ...form, insectRate: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Cassées</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.brokenRate}
                  onChange={(e) => setForm({ ...form, brokenRate: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Germées / Plates</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.flatRate}
                  onChange={(e) => setForm({ ...form, flatRate: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Aspects sensoriels et sacs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">Contrôle Visuel & Olfactif</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">Odeur</label>
                <select
                  value={form.smell}
                  onChange={(e) => setForm({ ...form, smell: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="CONFORME">Conforme (Neutre)</option>
                  <option value="MOISI">Moisie</option>
                  <option value="FUME">Fumée</option>
                  <option value="ACIDE">Acidulée</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">Couleur</label>
                <select
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="CONFORME">Conforme (Brun chocolat)</option>
                  <option value="TERNE">Terne / Grisâtre</option>
                  <option value="ARDOISEE">Ardoisée</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">État des sacs</label>
                <select
                  value={form.bagCondition}
                  onChange={(e) => setForm({ ...form, bagCondition: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="PROPRE">Propre / Sec</option>
                  <option value="HUMIDE">Humide / Moisissant</option>
                  <option value="DECHIRE">Déchiré / Souillé</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">Sacs humides (Qté)</label>
                <input
                  type="number"
                  value={form.wetBagsCount}
                  onChange={(e) => setForm({ ...form, wetBagsCount: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase">Observations / Remarques</label>
              <textarea
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 h-20"
                placeholder="Indiquez toute anomalie visuelle, corps étrangers ou non-conformité constatée..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => navigate('/purchases')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-6 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Save size={18} /> Enregistrer le contrôle
            </button>
          </div>
          
        </form>

      </div>
    </div>
  );
}

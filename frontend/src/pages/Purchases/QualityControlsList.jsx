import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Award, Check, X, ShieldAlert, AwardIcon, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';

export default function QualityControlsList() {
  const [controls, setControls] = useState([]);
  const [offlineQCs, setOfflineQCs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    avgMoisture: 0,
    avgImpurity: 0,
    grade1Count: 0,
    grade2Count: 0,
    subGradeCount: 0,
  });

  const [currentUser, setCurrentUser] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/quality-controls');
      const data = res.data || [];
      setControls(data);

      // Calculer des statistiques locales sur les contrôles qualité chargés
      if (data.length > 0) {
        let moistureSum = 0;
        let impuritySum = 0;
        let g1 = 0;
        let g2 = 0;
        let sg = 0;

        data.forEach(qc => {
          moistureSum += qc.moistureRate;
          impuritySum += qc.impurityRate;
          if (qc.purchase?.qualityGrade === 'GRADE_1') g1++;
          else if (qc.purchase?.qualityGrade === 'GRADE_2') g2++;
          else sg++;
        });

        setStats({
          avgMoisture: Math.round((moistureSum / data.length) * 10) / 10,
          avgImpurity: Math.round((impuritySum / data.length) * 10) / 10,
          grade1Count: g1,
          grade2Count: g2,
          subGradeCount: sg,
        });
      }

      // Load user profile to check role
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (err) {
      console.error("Erreur chargement contrôles qualité:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineQCs = () => {
    try {
      const offline = JSON.parse(localStorage.getItem('offline_quality_controls') || '[]');
      setOfflineQCs(offline);
    } catch (err) {
      console.error("Erreur chargement contrôles qualité hors-ligne:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadOfflineQCs();
  }, []);

  const handleSync = async () => {
    if (offlineQCs.length === 0) return;
    setLoading(true);
    let successCount = 0;

    for (const qc of offlineQCs) {
      try {
        const payload = { ...qc };
        delete payload.id;
        delete payload.purchaseNumber;
        delete payload.createdAt;
        
        await api.post('/api/v1/quality-controls', payload);
        successCount++;
      } catch (err) {
        console.error("Erreur de synchronisation pour le contrôle:", qc, err);
      }
    }

    if (successCount > 0) {
      const remaining = offlineQCs.slice(successCount);
      localStorage.setItem('offline_quality_controls', JSON.stringify(remaining));
      setOfflineQCs(remaining);
      alert(`${successCount} contrôles qualité ont été synchronisés avec succès !`);
      loadData();
    } else {
      alert("La synchronisation a échoué. Vérifiez votre connexion internet.");
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    const comment = prompt("Commentaire de validation (optionnel) :");
    try {
      await api.post(`/api/v1/quality-controls/${id}/validate`, { comment });
      alert("Contrôle qualité validé avec succès !");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleReject = async (id) => {
    const comment = prompt("Motif de rejet (obligatoire) :");
    if (comment === null) return;
    if (!comment.trim()) {
      alert("Un motif de rejet est obligatoire.");
      return;
    }
    try {
      await api.post(`/api/v1/quality-controls/${id}/reject`, { comment });
      alert("Contrôle qualité rejeté. L'achat associé a été annulé.");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du rejet');
    }
  };

  const canValidate = currentUser && ['ADMIN', 'DIRECTEUR', 'RESPONSABLE_QUALITE'].includes(currentUser.role?.name);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 flex items-center gap-3">
              <Award className="text-teal-400" /> Suivi & Contrôles Qualité
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Tableau de bord de conformité, réfactions appliquées et validations des lots reçus.
            </p>
          </div>
          
          {offlineQCs.length > 0 && (
            <button
              onClick={handleSync}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg transition-transform transform hover:-translate-y-0.5"
            >
              <RefreshCw size={18} className="animate-spin" /> Synchroniser hors-ligne ({offlineQCs.length})
            </button>
          )}
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Humidité moyenne</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.avgMoisture > 8.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stats.avgMoisture}%
              </h3>
            </div>
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl"><BarChart2 size={22} /></div>
          </div>

          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taux d'impuretés moyen</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-400">{stats.avgImpurity}%</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><BarChart2 size={22} /></div>
          </div>

          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lots Grade 1 / Grade 2</p>
              <h3 className="text-xl font-bold mt-1 text-slate-200">
                {stats.grade1Count} / {stats.grade2Count}
              </h3>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl"><CheckCircle2 size={22} /></div>
          </div>

          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lots déclassés (Sous-Grade)</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.subGradeCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {stats.subGradeCount}
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl"><ShieldAlert size={22} /></div>
          </div>
        </div>

        {/* Offline Quality Controls queue */}
        {offlineQCs.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <ShieldAlert /> Contrôles qualité en attente de synchronisation réseau
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-amber-500/20 text-amber-300/80">
                    <th className="p-3">Numéro d'achat</th>
                    <th className="p-3">Humidité</th>
                    <th className="p-3">Déchets</th>
                    <th className="p-3">Grainage</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-500/10 text-amber-200/90">
                  {offlineQCs.map(qc => (
                    <tr key={qc.id}>
                      <td className="p-3 font-semibold">{qc.purchaseNumber}</td>
                      <td className="p-3 font-mono">{qc.moistureRate}%</td>
                      <td className="p-3 font-mono">{qc.impurityRate}%</td>
                      <td className="p-3 font-mono">{qc.grainage}</td>
                      <td className="p-3">{new Date(qc.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quality Controls List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-200">Registre des contrôles qualité physiques</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="p-4">N° Contrôle</th>
                  <th className="p-4">N° Achat</th>
                  <th className="p-4">Humidité</th>
                  <th className="p-4">Déchets</th>
                  <th className="p-4">Grainage</th>
                  <th className="p-4">Réfaction (Kg)</th>
                  <th className="p-4">Perte (FCFA)</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {controls.map(qc => (
                  <tr key={qc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-sm text-teal-400 font-bold">{qc.controlNumber}</td>
                    <td className="p-4 font-semibold text-sm">{qc.purchase?.purchaseNumber}</td>
                    <td className={`p-4 font-mono text-sm ${qc.moistureRate > 8.0 ? 'text-amber-400 font-bold' : ''}`}>
                      {qc.moistureRate}%
                    </td>
                    <td className="p-4 font-mono text-sm">{qc.impurityRate}%</td>
                    <td className="p-4 font-mono text-sm">{qc.grainage}</td>
                    <td className="p-4 font-mono text-sm text-slate-300 font-medium">
                      {qc.weightRefactionKg > 0 ? `-${qc.weightRefactionKg} kg` : '0 kg'}
                    </td>
                    <td className="p-4 font-mono text-sm text-red-400">
                      {qc.financialLossFCFA > 0 ? `-${Math.round(qc.financialLossFCFA).toLocaleString()} FCFA` : '0 FCFA'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        qc.status === 'VALIDATED' ? 'bg-emerald-500/10 text-emerald-400' :
                        qc.status === 'PENDING_VALIDATION' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {qc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {qc.status === 'PENDING_VALIDATION' && canValidate ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(qc.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-1.5 rounded-lg transition-colors"
                            title="Valider"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(qc.id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold p-1.5 rounded-lg transition-colors"
                            title="Rejeter"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Aucune action requise</span>
                      )}
                    </td>
                  </tr>
                ))}
                {controls.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-500 italic">Aucun contrôle qualité enregistré.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

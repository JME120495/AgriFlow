import React, { useState } from 'react';
import { X, Layers, ShoppingBag, DollarSign, CreditCard, Users, Layout } from 'lucide-react';

const DashboardCustomize = ({ open, onClose, config, onSave }) => {
  const [visibleKpis, setVisibleKpis] = useState(config.visibleKpis || []);
  const [columns, setColumns] = useState(config.layout?.columns || 3);

  const kpiOptions = [
    { id: 'stock', label: 'Stocks de Cacao', desc: 'Affiche la quantité en stock (kg/tonnes), sacs et valeur estimée.', icon: <Layers className="w-5 h-5 text-cocoa-400" /> },
    { id: 'purchases', label: 'Achats du jour', desc: 'Affiche le nombre d\'achats, la quantité en kg et la somme payée.', icon: <ShoppingBag className="w-5 h-5 text-emerald-400" /> },
    { id: 'sales', label: 'Ventes du jour (CA)', desc: 'Affiche la quantité vendue et le chiffre d\'affaires total.', icon: <DollarSign className="w-5 h-5 text-indigo-400" /> },
    { id: 'finances', label: 'Indicateurs Financiers', desc: 'Affiche le solde de caisse, solde banque et les crédits de campagne.', icon: <CreditCard className="w-5 h-5 text-red-400" /> },
    { id: 'actors', label: 'Statistiques Acteurs', desc: 'Affiche le nombre de planteurs, d\'acheteurs et de connexions en direct.', icon: <Users className="w-5 h-5 text-blue-400" /> },
  ];

  const toggleKpi = (id) => {
    if (visibleKpis.includes(id)) {
      setVisibleKpis(visibleKpis.filter(k => k !== id));
    } else {
      setVisibleKpis([...visibleKpis, id]);
    }
  };

  const handleSave = () => {
    onSave({
      visibleKpis,
      layout: { columns }
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold">Personnaliser le Tableau de bord</h3>
            <p className="text-slate-400 text-xs mt-1">Configurez les widgets et la disposition de votre espace de travail.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section KPIs */}
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-300">Indicateurs (KPI) visibles</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {kpiOptions.map((kpi) => {
              const isChecked = visibleKpis.includes(kpi.id);
              return (
                <div
                  key={kpi.id}
                  onClick={() => toggleKpi(kpi.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-slate-800/40 border-cocoa-500/40 text-white'
                      : 'bg-slate-950/20 border-slate-800/80 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      {kpi.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{kpi.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{kpi.desc}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isChecked ? 'bg-cocoa-600 border-cocoa-500 text-white' : 'border-slate-700'
                  }`}>
                    {isChecked && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Colonnes/Disposition */}
        <div className="space-y-3 mb-8">
          <h4 className="text-sm font-semibold text-slate-300">Disposition de la grille</h4>
          <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-800 p-3 rounded-xl">
            <Layout className="w-5 h-5 text-slate-500" />
            <div className="flex-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Nombre de colonnes des cartes</span>
              <div className="flex gap-2">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setColumns(num)}
                    className={`w-8 h-8 rounded-lg font-bold border transition-all ${
                      columns === num
                        ? 'bg-cocoa-600 border-cocoa-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cocoa-600 hover:bg-cocoa-500 rounded-xl text-sm font-bold shadow-lg shadow-cocoa-600/10 transition-all"
          >
            Enregistrer les modifications
          </button>
        </div>

      </div>
    </div>
  );
};

export default DashboardCustomize;

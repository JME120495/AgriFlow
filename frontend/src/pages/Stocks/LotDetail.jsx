import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes, ChevronLeft, RefreshCw, AlertTriangle, LogOut, ArrowUpDown,
  Tag, Calendar, Shield, MapPin, DollarSign, Plus, CheckCircle2, Lock, Unlock,
  ArrowRight, Sparkles, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const MOCK_LOT = {
  id: 'l3',
  numeroLot: 'LOT-2026-07-003',
  campagne: '2025/2026',
  qualite: 'GRADE_1',
  poidsInitial: 3200,
  poidsActuel: 3200,
  nombreSacs: 50,
  valeurAchat: 4800000,
  valeurActuelle: 4800000,
  status: 'RESERVE',
  emplacement: {
    code: 'LOC-A-02',
    zone: {
      name: 'Zone A – Grade 1',
      warehouse: {
        name: 'Entrepôt Principal',
        store: { name: 'Magasin Régional Abengourou', code: 'MAG-02' }
      }
    }
  },
  mouvements: [
    { id: 'm1', type: 'INTERNAL_TRANSFER', weightKg: 3200, bagCount: 50, date: '2026-07-11T14:30:00Z', sourceLocation: { code: 'LOC-A-01' }, destLocation: { code: 'LOC-A-02' }, createdBy: { firstName: 'Toussaint', lastName: 'Boli' } }
  ],
  reservations: [
    { id: 'res1', quantite: 3200, motif: 'Réservation Exportation Cargo Soubré #45A', statut: 'ACTIVE', createdAt: '2026-07-11T15:00:00Z', utilisateur: { firstName: 'Toussaint', lastName: 'Boli' } }
  ]
};

const GRADE_LABELS = { GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', SOUS_GRADE: 'Sous-Grade' };
const STATUS_MAP = {
  DISPONIBLE: { label: 'Disponible', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  RESERVE: { label: 'Réservé', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  EXPEDIE: { label: 'Expédié', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  BLOQUE: { label: 'Bloqué', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
};

export default function LotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reservation form
  const [resQuantite, setResQuantite] = useState(0);
  const [resMotif, setResMotif] = useState('');
  const [submittingRes, setSubmittingRes] = useState(false);

  // Quick movement form
  const [mvtType, setMvtType] = useState('TRANSFERT'); // SORTIE, TRANSFERT
  const [mvtQuantite, setMvtQuantite] = useState(0);
  const [mvtSacs, setMvtSacs] = useState(0);
  const [mvtDestLocId, setMvtDestLocId] = useState('');
  const [mvtObs, setMvtObs] = useState('');
  const [submittingMvt, setSubmittingMvt] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchLot();
    fetchLocations();
  }, [id]);

  const fetchLot = async () => {
    setLoading(true);
    try {
      if (USE_MOCKS) {
        setLot(MOCK_LOT);
        setResQuantite(MOCK_LOT.poidsActuel);
      } else {
        const res = await api.get(`/api/v1/stocks/lots/${id}`);
        setLot(res.data);
        setResQuantite(res.data.poidsActuel);
      }
    } catch (err) {
      toast.error("Erreur lors de la récupération des détails du lot");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      if (!USE_MOCKS) {
        // En conditions réelles, charger la liste des emplacements disponibles pour transferts
        const res = await api.get('/api/v1/warehouses/stores');
        const locs = [];
        res.data.forEach((store) => {
          store.warehouses.forEach((wh) => {
            wh.storageZones.forEach((zone) => {
              zone.locations.forEach((loc) => {
                locs.push(loc);
              });
            });
          });
        });
        setLocations(locs);
      } else {
        setLocations([
          { id: 'loc-dest-1', code: 'LOC-A-01', capacityKg: 5000 },
          { id: 'loc-dest-2', code: 'LOC-A-05', capacityKg: 8000 },
          { id: 'loc-dest-3', code: 'LOC-B-01', capacityKg: 15000 }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (resQuantite <= 0) {
      toast.error("Veuillez saisir une quantité supérieure à 0.");
      return;
    }
    setSubmittingRes(true);
    try {
      if (USE_MOCKS) {
        toast.success("Lot réservé avec succès (Mode Démo)");
        setLot({ ...lot, status: 'RESERVE', reservations: [{ id: 'new-res', quantite: resQuantite, motif: resMotif, statut: 'ACTIVE', createdAt: new Date().toISOString(), utilisateur: { firstName: authUser.firstName, lastName: authUser.lastName } }, ...lot.reservations] });
      } else {
        await api.post('/api/v1/stocks/reservations', {
          lotId: id,
          quantite: Number(resQuantite),
          motif: resMotif
        });
        toast.success("Lot réservé avec succès");
        fetchLot();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de réservation");
    } finally {
      setSubmittingRes(false);
    }
  };

  const handleCancelReservation = async (resId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;
    try {
      if (USE_MOCKS) {
        toast.success("Réservation annulée (Mode Démo)");
        setLot({ ...lot, status: 'DISPONIBLE', reservations: lot.reservations.map(r => r.id === resId ? { ...r, statut: 'ANNULEE' } : r) });
      } else {
        await api.put(`/api/v1/stocks/reservations/${resId}/cancel`);
        toast.success("Réservation annulée");
        fetchLot();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'annulation");
    }
  };

  const handleCreateMovement = async (e) => {
    e.preventDefault();
    if (mvtQuantite <= 0 || mvtSacs <= 0) {
      toast.error("Veuillez remplir correctement les poids et nombres de sacs.");
      return;
    }
    setSubmittingMvt(true);
    try {
      if (USE_MOCKS) {
        toast.success("Mouvement de stock enregistré (Mode Démo)");
        fetchLot();
      } else {
        await api.post('/api/v1/stocks/movements', {
          lotId: id,
          type: mvtType,
          motif: mvtType === 'SORTIE' ? 'EXPEDITION' : 'TRANSFERT_INTERNE',
          quantite: Number(mvtQuantite),
          nombreSacs: Number(mvtSacs),
          emplacementDestId: mvtType === 'TRANSFERT' ? mvtDestLocId : undefined,
          observations: mvtObs
        });
        toast.success("Mouvement de stock enregistré");
        fetchLot();
        setMvtQuantite(0);
        setMvtSacs(0);
        setMvtObs('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors du mouvement de stock");
    } finally {
      setSubmittingMvt(false);
    }
  };

  const fmt = (n) => n?.toLocaleString('fr-FR') || '0';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-cocoa-400" /> Chargement du lot...
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 mr-3 text-amber-400" /> Lot introuvable.
      </div>
    );
  }

  const st = STATUS_MAP[lot.status] || STATUS_MAP.DISPONIBLE;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cocoa-600 to-amber-600 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AgriFlow <span className="text-cocoa-400 font-medium">ERP</span></span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-1 text-sm font-medium text-slate-400">
            <Link to="/dashboard" className="px-3 py-1.5 hover:text-white transition-colors">Tableau de bord</Link>
            <Link to="/stocks" className="px-3 py-1.5 hover:text-white transition-colors">Stocks</Link>
            <Link to="/stocks/lots" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Fiche Lot</Link>
          </nav>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cocoa-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              {authUser?.firstName?.[0] || 'U'}{authUser?.lastName?.[0] || 'S'}
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors" title="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-fade">
        {/* Back and Title */}
        <div>
          <button onClick={() => navigate('/stocks/lots')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" /> Retour aux lots
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cocoa-600 to-amber-600 flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{lot.numeroLot}</h1>
                <p className="text-sm text-slate-400 mt-1">Campagne : {lot.campagne} · Qualité : {GRADE_LABELS[lot.qualite] || lot.qualite}</p>
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${st.color}`}>
              {st.label}
            </span>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/10">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-5 h-5 text-cocoa-400" /> Caractéristiques physiques et financières
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800/40">
                    <span className="text-slate-400">Poids Initial</span>
                    <span className="font-mono font-semibold">{fmt(lot.poidsInitial)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800/40">
                    <span className="text-slate-400">Poids Disponible actuel</span>
                    <span className="font-mono font-bold text-emerald-400">{fmt(lot.poidsActuel)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800/40">
                    <span className="text-slate-400">Nombre de sacs</span>
                    <span className="font-semibold">{lot.nombreSacs} sacs de jute</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800/40">
                    <span className="text-slate-400">Valeur d'Achat</span>
                    <span className="font-mono font-semibold">{fmt(lot.valeurAchat)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800/40">
                    <span className="text-slate-400">Valeur Actuelle</span>
                    <span className="font-mono font-bold text-amber-400">{fmt(lot.valeurActuelle)} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-slate-800/40">
                    <span className="text-slate-400">Emplacement physique</span>
                    <span className="font-mono text-cocoa-400 font-semibold">{lot.emplacement?.code || 'Non localisé'}</span>
                  </div>
                </div>
              </div>

              {/* Localisation détaillée */}
              {lot.emplacement && lot.emplacement.zone && (
                <div className="mt-6 p-4 bg-slate-850/30 border border-slate-800 rounded-xl flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block text-slate-300">Localisation Physique de Stockage :</span>
                    {lot.emplacement.zone.warehouse.store.name} ({lot.emplacement.zone.warehouse.store.code}) · {lot.emplacement.zone.warehouse.name} · {lot.emplacement.zone.name}
                  </div>
                </div>
              )}
            </div>

            {/* Mouvement Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/10">
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2 border-b border-slate-800 pb-3">
                <ArrowUpDown className="w-5 h-5 text-blue-400" /> Historique des mouvements physiques du lot
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase border-b border-slate-800">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Mouvement</th>
                      <th className="p-3 text-right">Poids (kg)</th>
                      <th className="p-3 text-right">Sacs</th>
                      <th className="p-3 text-left">Opérateur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lot.mouvements || []).map((mvt) => (
                      <tr key={mvt.id} className="border-b border-slate-800/40 hover:bg-slate-850/10">
                        <td className="p-3 text-xs text-slate-400">{fmtDate(mvt.date)}</td>
                        <td className="p-3">
                          <span className="font-semibold text-xs">
                            {mvt.type === 'IN_PURCHASE' ? 'Entrée Achat' : mvt.type === 'OUT_SALE' ? 'Sortie Vente' : 'Transfert interne'}
                          </span>
                          {mvt.sourceLocation && <span className="text-[10px] text-slate-500 block">De {mvt.sourceLocation.code} vers {mvt.destLocation?.code}</span>}
                        </td>
                        <td className="p-3 text-right font-mono font-bold">{fmt(mvt.weightKg)}</td>
                        <td className="p-3 text-right">{mvt.bagCount}</td>
                        <td className="p-3 text-slate-400 text-xs">{mvt.createdBy?.firstName} {mvt.createdBy?.lastName}</td>
                      </tr>
                    ))}
                    {(!lot.mouvements || lot.mouvements.length === 0) && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">Aucun mouvement pour ce lot.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions & Reservations */}
          <div className="space-y-6">
            {/* Réservation Action */}
            {lot.status === 'DISPONIBLE' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/10">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-blue-400">
                  <Lock className="w-5 h-5 text-blue-400" /> Réserver ce lot
                </h3>
                <form onSubmit={handleReserve} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Quantité à réserver (kg)</label>
                    <input
                      type="number"
                      value={resQuantite}
                      onChange={(e) => setResQuantite(e.target.value)}
                      max={lot.poidsActuel}
                      min={1}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Motif de réservation (ex: export...)</label>
                    <textarea
                      value={resMotif}
                      onChange={(e) => setResMotif(e.target.value)}
                      rows={3}
                      required
                      placeholder="Indiquez le client export ou le numéro de contrat..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingRes}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    {submittingRes ? 'Réservation...' : 'Créer la réservation'}
                  </button>
                </form>
              </div>
            )}

            {/* Liste des réservations actives */}
            {lot.status === 'RESERVE' && lot.reservations && lot.reservations.length > 0 && (
              <div className="bg-slate-900 border border-blue-900/50 rounded-2xl p-6 shadow-xl shadow-black/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-blue-400">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" /> Réservation Active
                </h3>
                {lot.reservations.filter(r => r.statut === 'ACTIVE').map((r) => (
                  <div key={r.id} className="space-y-4">
                    <div className="text-xs text-slate-400 border-l-2 border-blue-500 pl-3 py-1">
                      <span className="font-bold text-slate-200 block text-sm mb-1">{fmt(r.quantite)} kg bloqués</span>
                      Motif: {r.motif}
                      <span className="block mt-1 font-mono text-[10px]">Créé le: {fmtDate(r.createdAt)} par {r.utilisateur?.firstName}</span>
                    </div>
                    {authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR' ? (
                      <button
                        onClick={() => handleCancelReservation(r.id)}
                        className="w-full py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/30 transition-all rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Annuler la réservation
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic text-center">Seul un administrateur ou directeur peut libérer ce lot.</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mouvement rapide */}
            {lot.status === 'DISPONIBLE' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/10">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-cocoa-400">
                  <ArrowUpDown className="w-5 h-5 text-cocoa-400" /> Mouvement physique
                </h3>
                <form onSubmit={handleCreateMovement} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Opération</label>
                    <select
                      value={mvtType}
                      onChange={(e) => setMvtType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cocoa-500"
                    >
                      <option value="TRANSFERT">Transfert Emplacement</option>
                      <option value="SORTIE">Sortie / Expédition</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Poids (kg)</label>
                      <input
                        type="number"
                        value={mvtQuantite}
                        onChange={(e) => setMvtQuantite(e.target.value)}
                        min={1}
                        max={lot.poidsActuel}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-cocoa-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Sacs</label>
                      <input
                        type="number"
                        value={mvtSacs}
                        onChange={(e) => setMvtSacs(e.target.value)}
                        min={1}
                        max={lot.nombreSacs}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-cocoa-500 font-mono"
                      />
                    </div>
                  </div>
                  {mvtType === 'TRANSFERT' && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Nouvel Emplacement</label>
                      <select
                        value={mvtDestLocId}
                        onChange={(e) => setMvtDestLocId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cocoa-500"
                      >
                        <option value="">Sélectionner...</option>
                        {locations.filter(l => l.code !== lot.emplacement?.code).map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.code} ({fmt(loc.capacityKg - loc.currentWeightKg)} kg dispo)</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Observations</label>
                    <input
                      type="text"
                      value={mvtObs}
                      onChange={(e) => setMvtObs(e.target.value)}
                      placeholder="Commentaire ou motif..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-cocoa-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingMvt}
                    className="w-full py-2.5 rounded-xl bg-cocoa-600 hover:bg-cocoa-500 transition-colors text-white text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    {submittingMvt ? 'Enregistrement...' : <><Send className="w-4 h-4" /> Enregistrer le mouvement</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

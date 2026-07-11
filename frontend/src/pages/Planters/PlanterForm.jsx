import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Loader2, User, MapPin, Clipboard, Landmark } from 'lucide-react';

const PlanterForm = () => {
  const { id } = useParams();
  const editMode = !!id;
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState('personal');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stores, setStores] = useState([]);
  const [managers, setManagers] = useState([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'M',
    birth_date: '',
    phone: '',
    phone_secondary: '',
    address: '',
    avatar_url: '',
    id_type: 'CNI',
    id_number: '',
    id_expiry: '',
    id_front_url: '',
    id_back_url: '',
    status: 'ACTIVE',
    store_id: '',
    zone_manager_id: '',
    sub_buyer_id: '',
    plantation: {
      name: '',
      location: '',
      area_hectares: '',
      parcels_count: '1',
      trees_count: '',
      creation_year: '',
      variety: 'Forastero',
      latitude: '',
      longitude: '',
    }
  });

  useEffect(() => {
    // Charger la liste des magasins et managers pour l'affectation commerciale
    const loadMetadata = async () => {
      try {
        // En conditions réelles :
        // const storeRes = await api.get('/stores');
        // const userRes = await api.get('/users?role=CHEF_DE_ZONE');
        setStores([
          { id: 'store1', name: 'Magasin Central Douala' },
          { id: 'store2', name: 'Magasin Régional Abengourou' },
          { id: 'store3', name: 'Magasin Régional Soubré' },
        ]);
        setManagers([
          { id: 'm1', firstName: 'Mamadou', lastName: 'Diallo', jobTitle: 'Chef de Zone Est' }
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    loadMetadata();

    // Charger les données du planteur s'il s'agit d'une modification
    if (editMode) {
      const loadPlanter = async () => {
        try {
          const res = await api.get(`/planters/${id}`);
          const p = res.data;
          setFormData({
            first_name: p.firstName,
            last_name: p.lastName,
            gender: p.gender,
            birth_date: p.birthDate ? p.birthDate.split('T')[0] : '',
            phone: p.phone || '',
            phone_secondary: p.phoneSecondary || '',
            address: p.address || '',
            avatar_url: p.avatarUrl || '',
            id_type: p.idType || 'CNI',
            id_number: p.idNumber || '',
            id_expiry: p.idExpiry ? p.idExpiry.split('T')[0] : '',
            id_front_url: p.idFrontUrl || '',
            id_back_url: p.idBackUrl || '',
            status: p.status,
            store_id: p.storeId || '',
            zone_manager_id: p.zoneManagerId || '',
            sub_buyer_id: p.subBuyerId || '',
            plantation: p.plantation ? {
              name: p.plantation.name,
              location: p.plantation.location || '',
              area_hectares: String(p.plantation.areaHectares),
              parcels_count: String(p.plantation.parcelsCount),
              trees_count: p.plantation.treesCount ? String(p.plantation.treesCount) : '',
              creation_year: p.plantation.creationYear ? String(p.plantation.creationYear) : '',
              variety: p.plantation.variety || 'Forastero',
              latitude: p.plantation.latitude ? String(p.plantation.latitude) : '',
              longitude: p.plantation.longitude ? String(p.plantation.longitude) : '',
            } : formData.plantation
          });
        } catch (err) {
          console.error(err);
        }
      };
      loadPlanter();
    }
  }, [id, editMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editMode) {
        await api.put(`/planters/${id}`, formData);
      } else {
        await api.post('/planters', formData);
      }
      navigate('/planters');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.");
      setSubmitting(false);
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
            <Link to="/planters" className="px-3 py-1.5 text-white bg-slate-800 rounded-lg">Planteurs</Link>
            {(authUser?.role?.name === 'ADMIN' || authUser?.role?.name === 'DIRECTEUR') && (
              <>
                <Link to="/admin/users" className="px-3 py-1.5 hover:text-white transition-colors">Collaborateurs</Link>
                <Link to="/admin/permissions" className="px-3 py-1.5 hover:text-white transition-colors">Permissions</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-4xl w-full mx-auto space-y-6 animate-fade">
        {/* En-tête de page */}
        <div className="flex items-center gap-4">
          <Link to="/planters" className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-850">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{editMode ? 'Modifier le Planteur' : 'Enregistrer un Planteur'}</h1>
            <p className="text-slate-400 text-sm">Créez ou mettez à jour la fiche administrative, agricole et d'identification.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Formulaire à onglets */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* Navigation des onglets */}
          <div className="flex border-b border-slate-800/80 bg-slate-900/60 p-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'personal' ? 'bg-cocoa-600 text-white shadow-md shadow-cocoa-600/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Infos Personnelles</span>
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'location' ? 'bg-cocoa-600 text-white shadow-md shadow-cocoa-600/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Localisation</span>
            </button>
            <button
              onClick={() => setActiveTab('agricultural')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'agricultural' ? 'bg-cocoa-600 text-white shadow-md shadow-cocoa-600/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Informations Agricoles</span>
            </button>
            <button
              onClick={() => setActiveTab('commercial')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'commercial' ? 'bg-cocoa-600 text-white shadow-md shadow-cocoa-600/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Commercial & Rattachement</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Onglet 1 : Infos Personnelles */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Prénom</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Nom de famille</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Sexe</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-cocoa-500"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Date de naissance</label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Photo de profil (URL)</label>
                    <input
                      type="text"
                      placeholder="Lien vers la photo"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Téléphone principal</label>
                    <input
                      type="text"
                      required
                      placeholder="+2250707070701"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Téléphone secondaire</label>
                    <input
                      type="text"
                      placeholder="+225xxxxxxxx"
                      value={formData.phone_secondary}
                      onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Adresse</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                  />
                </div>

                {/* Pièces d'identité sous-groupe */}
                <div className="pt-4 border-t border-slate-800/80">
                  <h4 className="text-sm font-semibold mb-3">Pièce d'identité</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Type de pièce</label>
                      <select
                        value={formData.id_type}
                        onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none"
                      >
                        <option value="CNI">Carte Nationale d'Identité (CNI)</option>
                        <option value="PASSPORT">Passeport</option>
                        <option value="CARTE_CONSEIL">Carte Conseil Café-Cacao</option>
                        <option value="PERMIS">Permis de conduire</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Numéro de pièce</label>
                      <input
                        type="text"
                        value={formData.id_number}
                        onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Date d'expiration</label>
                      <input
                        type="date"
                        value={formData.id_expiry}
                        onChange={(e) => setFormData({ ...formData, id_expiry: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onglet 2 : Localisation */}
            {activeTab === 'location' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Arrondissement / Commune</label>
                    <input
                      type="text"
                      placeholder="Ex: Abengourou Commune"
                      value={formData.address} // On stocke les infos régionales dans adresse/localisation
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Village / Campement</label>
                    <input
                      type="text"
                      placeholder="Ex: Village Abron"
                      value={formData.plantation.location}
                      onChange={(e) => setFormData({
                        ...formData,
                        plantation: { ...formData.plantation, location: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Quartier</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Latitude GPS (Décimales)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 6.7291"
                      value={formData.plantation.latitude}
                      onChange={(e) => setFormData({
                        ...formData,
                        plantation: { ...formData.plantation, latitude: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Longitude GPS (Décimales)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: -3.4839"
                      value={formData.plantation.longitude}
                      onChange={(e) => setFormData({
                        ...formData,
                        plantation: { ...formData.plantation, longitude: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Onglet 3 : Infos Agricoles */}
            {activeTab === 'agricultural' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Nom de la Plantation</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Plantation Ouattara Abengourou"
                      value={formData.plantation.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        plantation: { ...formData.plantation, name: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Superficie (hectares)</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Ex: 12.5"
                      value={formData.plantation.area_hectares}
                      onChange={(e) => setFormData({
                        ...formData,
                        plantation: { ...formData.plantation, area_hectares: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Nombre de parcelles</label>
                    <input
                      type="number"
                      value={formData.plantation.parcels_count}
                      onChange={(e) => setFormData({
                        ...formData,
                        plantation: { ...formData.plantation, parcels_count: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Nombre approximatif de cacaoyers</label>
                    <input
                      type="number"
                      placeholder="Ex: 8000"
                      value={formData.plantation.trees_count}
                      onChange={(e) => setFormData({
                        ...formData,
                        plantation: { ...formData.plantation, trees_count: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Année de création</label>
                    <input
                      type="number"
                      placeholder="Ex: 2018"
                      value={formData.plantation.creation_year}
                      onChange={(e) => setFormData({
                        ...formData,
                        plantation: { ...formData.plantation, creation_year: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Variété cultivée</label>
                  <select
                    value={formData.plantation.variety}
                    onChange={(e) => setFormData({
                      ...formData,
                      plantation: { ...formData.plantation, variety: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-cocoa-500"
                  >
                    <option value="Forastero">Forastero (Amelonado - Standard robuste)</option>
                    <option value="Criollo">Criollo (Fin et aromatique - Fragile)</option>
                    <option value="Trinitario">Trinitario (Hybride - Robuste & Aromatique)</option>
                    <option value="Mercedes">Mercedes (Sélection précoce à haut rendement)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Onglet 4 : Commercial */}
            {activeTab === 'commercial' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Centre de Collecte / Magasin de rattachement</label>
                    <select
                      required
                      value={formData.store_id}
                      onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none"
                    >
                      <option value="">Sélectionner un magasin...</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Chef de Zone Responsable</label>
                    <select
                      value={formData.zone_manager_id}
                      onChange={(e) => setFormData({ ...formData, zone_manager_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none"
                    >
                      <option value="">Sélectionner le chef de zone...</option>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Sous-Acheteur Terrain Responsable (ID)</label>
                    <input
                      type="text"
                      placeholder="Identifiant UUID du sous-acheteur"
                      value={formData.sub_buyer_id}
                      onChange={(e) => setFormData({ ...formData, sub_buyer_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cocoa-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Statut d'activité du planteur</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none"
                    >
                      <option value="ACTIVE">Actif (Autorisé aux ventes & crédits)</option>
                      <option value="SUSPENDED">Suspendu (Défaut de paiement ou litige)</option>
                      <option value="DEACTIVATED">Inactif (Dossier archivé)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Pied du formulaire avec actions */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-800/80">
              <span className="text-slate-500 text-xs font-mono">Champs obligatoires à remplir pour valider l'onglet.</span>
              <div className="flex gap-3">
                <Link
                  to="/planters"
                  className="px-5 py-2.5 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cocoa-600 to-cocoa-500 hover:from-cocoa-500 hover:to-cocoa-400 text-white font-bold rounded-xl shadow-lg shadow-cocoa-600/10 active:scale-[0.98] transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Enregistrer la Fiche</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default PlanterForm;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogOut, ChevronLeft, Layers, MapPin, ZoomIn, Info } from 'lucide-react';

const MOCK_MAP_POINTS = [
  { id: 'p1', type: 'PLANTER', name: 'Alassane Ouattara', lat: 6.8215, lng: -3.4982, details: 'Plantation 12.5 Hectares - Qualité UTZ' },
  { id: 'p2', type: 'PLANTER', name: 'Koffi Kouamé', lat: 6.8350, lng: -3.4810, details: 'Plantation 8.2 Hectares - Cacao Conventionnel' },
  { id: 's1', type: 'STORE', name: 'Magasin Régional Abengourou', lat: 6.8275, lng: -3.4920, details: 'Capacité : 50 Tonnes / Stock actuel : 12.4 Tonnes' },
  { id: 'sb1', type: 'SUB_BUYER', name: 'Paul Koffi', lat: 6.8190, lng: -3.5020, details: 'Pisteur en collecte mobile' }
];

const ZoneMap = () => {
  const { logout, user: authUser } = useAuth();
  const [points, setPoints] = useState(MOCK_MAP_POINTS);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const getRoleBadge = () => {
    return authUser?.role?.name || 'Collaborateur';
  };

  const filteredPoints = points.filter(p => filterType === 'ALL' || p.type === filterType);

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

      {/* Map Layout */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Sidebar Controls */}
        <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 z-10 shadow-xl">
          <div>
            <Link to="/zone-managers" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors mb-4">
              <ChevronLeft className="w-4 h-4" /> Retour
            </Link>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cocoa-400" />
              Carte SIG Interactive
            </h2>
            <p className="text-xs text-slate-400 mt-1">Filtrez et visualisez l'ensemble des points d'intérêts sur le terrain.</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrer par Type</span>
            <div className="flex flex-col gap-1.5 text-sm font-medium">
              <button 
                onClick={() => setFilterType('ALL')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all ${filterType === 'ALL' ? 'bg-cocoa-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Tous les points ({points.length})
              </button>
              <button 
                onClick={() => setFilterType('PLANTER')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all ${filterType === 'PLANTER' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Planteurs ({points.filter(p => p.type === 'PLANTER').length})
              </button>
              <button 
                onClick={() => setFilterType('STORE')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all ${filterType === 'STORE' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Magasins de stockage ({points.filter(p => p.type === 'STORE').length})
              </button>
              <button 
                onClick={() => setFilterType('SUB_BUYER')}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all ${filterType === 'SUB_BUYER' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Pisteurs / Collecteurs ({points.filter(p => p.type === 'SUB_BUYER').length})
              </button>
            </div>
          </div>

          {selectedPoint && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${selectedPoint.type === 'PLANTER' ? 'text-emerald-400' : selectedPoint.type === 'STORE' ? 'text-amber-400' : 'text-indigo-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{selectedPoint.type}</span>
              </div>
              <h3 className="font-bold text-slate-100">{selectedPoint.name}</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">{selectedPoint.details}</p>
              <div className="flex gap-2 text-[10px] text-slate-500 font-mono">
                <span>Lat: {selectedPoint.lat}</span>
                <span>Lng: {selectedPoint.lng}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Map Rendering Container */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          {/* Note overlay to indicate Leaflet map container simulation */}
          <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-400 flex items-center gap-2 shadow-lg">
            <Info className="w-4 h-4 text-cocoa-400" />
            <span>Fond de carte OpenStreetMap - Abengourou (Côte d'Ivoire)</span>
          </div>

          {/* Simulated Premium Dark Theme Map Canvas */}
          <div className="w-full h-full relative bg-slate-950 flex items-center justify-center border-l border-slate-900">
            {/* Grid pattern to simulate map lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
            
            {/* Abengourou Region Outlines and Rivers simulated */}
            <svg className="absolute w-[80%] h-[80%] text-slate-900 opacity-20" viewBox="0 0 100 100">
              <path d="M 10 30 Q 30 60 40 40 T 90 80" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M 20 80 Q 50 20 80 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2" />
            </svg>

            {/* Interactive Pins */}
            {filteredPoints.map(p => {
              const xPos = ((p.lng + 3.51) / 0.04) * 100; // Transform lat/lng to percentage bounds
              const yPos = (1 - ((p.lat - 6.81) / 0.03)) * 100;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPoint(p)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all z-20"
                  style={{ left: `${xPos}%`, top: `${yPos}%` }}
                >
                  {/* Pin Circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg cursor-pointer transform group-hover:scale-125 transition-transform ${p.type === 'PLANTER' ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : p.type === 'STORE' ? 'bg-amber-950 border-amber-500 text-amber-400' : 'bg-indigo-950 border-indigo-500 text-indigo-400'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  {/* Pin label tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-10 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-md">
                    {p.name}
                  </div>
                </button>
              );
            })}

            {/* Scale indicator */}
            <div className="absolute bottom-6 left-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-slate-500 font-mono flex items-center gap-2">
              <span>Échelle : 1 km</span>
              <div className="w-12 h-1 bg-slate-700 relative">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-cocoa-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneMap;

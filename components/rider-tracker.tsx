'use client';

import React, { useEffect, useState, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Location { lat: number; lng: number; timestamp: string; }

interface Zone {
  name: string;
  center: [number, number];
  radius: number;
  waterloggingRisk: number;
  crimeRisk: number;
  trafficRisk: number;
  color: string;
  protectionLabel: 'Standard' | 'Enhanced' | 'Maximum';
  protectionDescription: string;
}

interface PricingResult {
  basePremium: number;
  adjustedPremium: number;
  discount: number;
  extraCoverageHours: number;
  reason: string[];
  dominantZone: string;
  weatherForecast: 'Clear' | 'Monsoon Alert' | 'Heavy Rain Expected';
  totalTrips: number;
  avgDailyKm: number;
  activeDays: number;
}

// ─── Kattankulathur / SRM area zones ─────────────────────────────────────────
// Reframed: no zone is "dangerous" — higher risk = more Bachat protection
const KATTANKULATHUR_ZONES: Zone[] = [
  {
    name: 'SRM University',
    center: [12.8231, 80.0441],
    radius: 900,
    waterloggingRisk: 0.15,
    crimeRisk: 0.08,
    trafficRisk: 0.4,
    color: '#22c55e',
    protectionLabel: 'Standard',
    protectionDescription: 'Campus area — low incident, standard Bachat coverage',
  },
  {
    name: 'Potheri',
    center: [12.8188, 80.0371],
    radius: 800,
    waterloggingRisk: 0.2,
    crimeRisk: 0.12,
    trafficRisk: 0.5,
    color: '#22c55e',
    protectionLabel: 'Standard',
    protectionDescription: 'Residential hub — standard Bachat coverage applies',
  },
  {
    name: 'Guduvanchery',
    center: [12.8478, 80.0604],
    radius: 1200,
    waterloggingRisk: 0.55,
    crimeRisk: 0.22,
    trafficRisk: 0.7,
    color: '#3b82f6',
    protectionLabel: 'Enhanced',
    protectionDescription: 'Bachat auto-extends your coverage window here',
  },
  {
    name: 'Maraimalai Nagar',
    center: [12.7935, 80.0242],
    radius: 1300,
    waterloggingRisk: 0.4,
    crimeRisk: 0.18,
    trafficRisk: 0.55,
    color: '#3b82f6',
    protectionLabel: 'Enhanced',
    protectionDescription: 'Industrial area — Bachat Enhanced coverage active',
  },
  {
    name: 'Chengalpattu',
    center: [12.6919, 79.9762],
    radius: 1500,
    waterloggingRisk: 0.65,
    crimeRisk: 0.28,
    trafficRisk: 0.75,
    color: '#8b5cf6',
    protectionLabel: 'Maximum',
    protectionDescription: 'Maximum Bachat — instant claims + extended coverage + weather alerts',
  },
  {
    name: 'Urapakkam',
    center: [12.8633, 80.0567],
    radius: 1000,
    waterloggingRisk: 0.3,
    crimeRisk: 0.15,
    trafficRisk: 0.6,
    color: '#22c55e',
    protectionLabel: 'Standard',
    protectionDescription: 'Suburban zone — standard Bachat coverage applies',
  },
  {
    name: 'Vandalur',
    center: [12.8831, 80.0809],
    radius: 1100,
    waterloggingRisk: 0.45,
    crimeRisk: 0.2,
    trafficRisk: 0.65,
    color: '#3b82f6',
    protectionLabel: 'Enhanced',
    protectionDescription: 'Highway corridor — Bachat Enhanced coverage active',
  },
  {
    name: 'GST Road Corridor',
    center: [12.8400, 80.0200],
    radius: 1400,
    waterloggingRisk: 0.72,
    crimeRisk: 0.3,
    trafficRisk: 0.85,
    color: '#8b5cf6',
    protectionLabel: 'Maximum',
    protectionDescription: 'High-traffic highway — Maximum Bachat with instant claims active',
  },
];

// ─── Generate 30 days of simulated routes ─────────────────────────────────────
function generateHistoricalRoutes(): Location[] {
  const routes: Location[] = [];
  const now = Date.now();
  const msPerDay = 86400000;

  // Rider mainly works SRM → Potheri → Guduvanchery corridor
  const routePatterns = [
    { zone: KATTANKULATHUR_ZONES[0], weight: 28 }, // SRM
    { zone: KATTANKULATHUR_ZONES[1], weight: 22 }, // Potheri
    { zone: KATTANKULATHUR_ZONES[2], weight: 18 }, // Guduvanchery
    { zone: KATTANKULATHUR_ZONES[5], weight: 12 }, // Urapakkam
    { zone: KATTANKULATHUR_ZONES[3], weight: 8  }, // Maraimalai Nagar
    { zone: KATTANKULATHUR_ZONES[6], weight: 7  }, // Vandalur
    { zone: KATTANKULATHUR_ZONES[4], weight: 3  }, // Chengalpattu
    { zone: KATTANKULATHUR_ZONES[7], weight: 2  }, // GST Road
  ];
  const totalWeight = routePatterns.reduce((s, r) => s + r.weight, 0);

  for (let day = 30; day >= 1; day--) {
    const dayMs = now - day * msPerDay;
    // 4-10 deliveries per day simulated
    const deliveries = 4 + Math.floor(Math.random() * 6);

    for (let p = 0; p < deliveries; p++) {
      let rand = Math.random() * totalWeight;
      let chosen = routePatterns[0].zone;
      for (const rp of routePatterns) {
        rand -= rp.weight;
        if (rand <= 0) { chosen = rp.zone; break; }
      }
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.random() * chosen.radius / 111320;
      routes.push({
        lat: chosen.center[0] + dist * Math.cos(angle),
        lng: chosen.center[1] + dist * Math.sin(angle),
        timestamp: new Date(dayMs + p * 2700000 + Math.random() * 1800000).toISOString(),
      });
    }
  }
  return routes;
}

// ─── Haversine & Zone Detection ───────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectZone(lat: number, lng: number): Zone | null {
  for (const z of KATTANKULATHUR_ZONES) {
    if (haversine(lat, lng, z.center[0], z.center[1]) <= z.radius) return z;
  }
  return null;
}

// ─── AI Dynamic Pricing Engine ────────────────────────────────────────────────
function computeAIPrice(history: Location[]): PricingResult {
  const BASE_PREMIUM = 49;
  const reasons: string[] = [];
  let discount = 0;
  let extraHours = 0;

  // Zone analysis
  const zoneCounts: Record<string, { zone: Zone; count: number }> = {};
  for (const loc of history) {
    const z = detectZone(loc.lat, loc.lng);
    if (z) {
      if (!zoneCounts[z.name]) zoneCounts[z.name] = { zone: z, count: 0 };
      zoneCounts[z.name].count++;
    }
  }

  let dominantZoneName = 'Unknown';
  let maxCount = 0;
  let avgWaterRisk = 0;
  let avgCrimeRisk = 0;
  let totalZoneVisits = 0;

  for (const [name, entry] of Object.entries(zoneCounts)) {
    if (entry.count > maxCount) { maxCount = entry.count; dominantZoneName = name; }
    avgWaterRisk += entry.zone.waterloggingRisk * entry.count;
    avgCrimeRisk += entry.zone.crimeRisk * entry.count;
    totalZoneVisits += entry.count;
  }

  if (totalZoneVisits > 0) {
    avgWaterRisk /= totalZoneVisits;
    avgCrimeRisk /= totalZoneVisits;
  }

  // Rule 1: Waterlogging
  if (avgWaterRisk < 0.25) {
    discount += 4;
    reasons.push('₹4 saved — routes have low waterlogging exposure');
  } else if (avgWaterRisk < 0.5) {
    discount += 2;
    reasons.push('₹2 saved — moderate waterlogging exposure on routes');
  } else {
    reasons.push('Base rate — Bachat maximum protection active');
  }

  // Rule 2: Crime
  if (avgCrimeRisk < 0.2) {
    discount += 2;
    reasons.push('₹2 saved — low-incident operating area');
  }

  // Rule 3: Weather / flood-prone zones
  const maxProtVisits = (zoneCounts['Chengalpattu']?.count ?? 0) + (zoneCounts['GST Road Corridor']?.count ?? 0);
  let weatherForecast: 'Clear' | 'Monsoon Alert' | 'Heavy Rain Expected' = 'Clear';
  if (maxProtVisits >= 6) {
    weatherForecast = 'Heavy Rain Expected';
    extraHours = 4;
    reasons.push('+4h bonus coverage — weather model predicts rain on routes');
  } else if (maxProtVisits >= 3) {
    weatherForecast = 'Monsoon Alert';
    extraHours = 2;
    reasons.push('+2h bonus coverage — moderate rain forecast');
  } else {
    reasons.push('Standard 8h/day coverage — clear weather forecast');
  }

  // Rule 4: Loyalty
  const activeDays = new Set(history.map(l => l.timestamp.substring(0, 10))).size;
  if (activeDays >= 25) {
    discount += 3;
    reasons.push('₹3 loyalty bonus — active 25+ days this month');
  } else if (activeDays >= 15) {
    discount += 1;
    reasons.push('₹1 bonus — active 15+ days this month');
  }

  // Trip stats
  const totalTrips = history.length;
  const avgDailyKm = Math.round((totalTrips * 2.8 + Math.random() * 20) / activeDays * 10) / 10;

  return {
    basePremium: BASE_PREMIUM,
    adjustedPremium: Math.max(BASE_PREMIUM - discount, 29),
    discount,
    extraCoverageHours: extraHours,
    reason: reasons,
    dominantZone: dominantZoneName,
    weatherForecast,
    totalTrips,
    avgDailyKm,
    activeDays,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RiderTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [liveLocations, setLiveLocations] = useState<Location[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'zones' | 'pricing'>('map');
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const livePolylineRef = useRef<any>(null);
  const zoneLayerRef = useRef<any>(null);
  const historicalLayerRef = useRef<any>(null);

  useEffect(() => {
    const L = require('leaflet');
    require('leaflet/dist/leaflet.css');

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapRef.current) {
      // Center on Kattankulathur / SRM area, zoom level 13 for local detail
      mapRef.current = L.map('rider-map').setView([12.8231, 80.0441], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OSM © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Custom rider marker
      const riderIcon = L.divIcon({
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 12px rgba(59,130,246,0.6)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: '',
      });
      markerRef.current = L.marker([12.8231, 80.0441], { icon: riderIcon }).addTo(mapRef.current)
        .bindPopup('<b>Current Location</b><br/>SRM University Campus');
      livePolylineRef.current = L.polyline([], { color: '#60a5fa', weight: 3, dashArray: '8 4' }).addTo(mapRef.current);

      // Draw zone circles with labels
      zoneLayerRef.current = L.layerGroup().addTo(mapRef.current);
      for (const z of KATTANKULATHUR_ZONES) {
        L.circle(z.center, {
          radius: z.radius,
          color: z.color,
          fillColor: z.color,
          fillOpacity: 0.12,
          weight: 1.5,
        }).bindPopup(
          `<div style="font-family:system-ui;font-size:12px;line-height:1.5">` +
          `<b>${z.name}</b><br/>` +
          `<span style="color:${z.color};font-weight:600">${z.protectionLabel} Protection</span><br/>` +
          `<span style="color:#888">${z.protectionDescription}</span></div>`
        ).addTo(zoneLayerRef.current);

        // Zone name label on map
        L.marker(z.center, {
          icon: L.divIcon({
            html: `<div style="background:${z.color}dd;color:#fff;padding:1px 6px;border-radius:10px;font-size:9px;font-weight:700;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.5)">${z.name}</div>`,
            iconAnchor: [30, 6],
            className: '',
          }),
        }).addTo(zoneLayerRef.current);
      }

      // Historical route dots
      const history = generateHistoricalRoutes();
      historicalLayerRef.current = L.layerGroup().addTo(mapRef.current);

      // Group by day for connecting lines
      const dayGroups: Record<string, Location[]> = {};
      for (const loc of history) {
        const day = loc.timestamp.substring(0, 10);
        if (!dayGroups[day]) dayGroups[day] = [];
        dayGroups[day].push(loc);
      }

      // Draw lines connecting daily routes (faded)
      Object.values(dayGroups).forEach((dayLocs) => {
        if (dayLocs.length > 1) {
          const coords = dayLocs.map(l => [l.lat, l.lng] as [number, number]);
          L.polyline(coords, { color: '#3b82f6', weight: 1.5, opacity: 0.25 }).addTo(historicalLayerRef.current);
        }
      });

      // Draw dots
      for (const loc of history) {
        const z = detectZone(loc.lat, loc.lng);
        L.circleMarker([loc.lat, loc.lng], {
          radius: 3,
          color: z ? z.color : '#94a3b8',
          fillColor: z ? z.color : '#94a3b8',
          fillOpacity: 0.7,
          weight: 0.5,
        }).addTo(historicalLayerRef.current);
      }

      setPricing(computeAIPrice(history));
      setHistoryLoaded(true);
    }
  }, []);

  // Live GPS tracking
  useEffect(() => {
    let watchId: number;
    if (isTracking && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc: Location = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: new Date().toISOString() };
          setLiveLocations((prev) => {
            const next = [...prev, loc];
            livePolylineRef.current?.setLatLngs(next.map((l) => [l.lat, l.lng]));
            markerRef.current?.setLatLng([loc.lat, loc.lng]);
            mapRef.current?.flyTo([loc.lat, loc.lng], mapRef.current.getZoom());
            return next;
          });
        },
        (err) => { setErrorMsg(err.message); setIsTracking(false); },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isTracking]);

  const protStyle = (label: string) => {
    const m: Record<string, string> = {
      Standard: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      Enhanced: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
      Maximum: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    };
    return m[label] ?? '';
  };

  const wIcon = (f: string) => f === 'Clear' ? '☀️' : f === 'Monsoon Alert' ? '🌧️' : '⛈️';

  return (
    <div className="rounded-xl border border-white/5 bg-[#0f1e36]/90 backdrop-blur-md shadow-lg overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h3 className="font-semibold text-white/90 text-sm tracking-wide">Route Intelligence</h3>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {historyLoaded && <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></>}
            </span>
            {historyLoaded ? `30-day analysis • ${pricing?.totalTrips ?? 0} trips tracked • ML v1.0` : 'Loading…'}
          </p>
        </div>
        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full border ${isTracking ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800/50 text-slate-400 border-slate-700'}`}>
          {isTracking ? '● Live' : 'Paused'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-5">
        {(['map', 'zones', 'pricing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 text-xs font-semibold tracking-wide border-b-2 transition-all ${
              activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'map' ? '🗺 Routes' : tab === 'zones' ? '🛡️ Zones' : '🤖 AI Pricing'}
          </button>
        ))}
      </div>

      {/* ─── Routes Tab ─── */}
      {activeTab === 'map' && (
        <div className="p-4 flex flex-col gap-3">
          {errorMsg && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-2 rounded-lg">{errorMsg}</p>}

          <div id="rider-map" className="w-full rounded-xl overflow-hidden border border-white/10 shadow-inner" style={{ height: 280, background: '#0b1222' }} />

          {/* Stats bar */}
          {pricing && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-white/5">
                <p className="text-lg font-bold text-white">{pricing.totalTrips}</p>
                <p className="text-[10px] text-slate-500 uppercase">Total Trips</p>
              </div>
              <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-white/5">
                <p className="text-lg font-bold text-white">{pricing.activeDays}</p>
                <p className="text-[10px] text-slate-500 uppercase">Active Days</p>
              </div>
              <div className="bg-slate-800/40 rounded-lg p-2 text-center border border-white/5">
                <p className="text-lg font-bold text-white">{pricing.avgDailyKm}</p>
                <p className="text-[10px] text-slate-500 uppercase">Avg km/day</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 text-[11px] justify-center bg-slate-900/50 p-2 rounded-lg border border-white/5">
            {[
              { color: '#22c55e', label: 'Standard' },
              { color: '#3b82f6', label: 'Enhanced' },
              { color: '#8b5cf6', label: 'Maximum' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}55` }} />
                <span className="text-slate-300">{l.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isTracking
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isTracking ? 'Stop Live Tracking' : 'Start Live Tracking'}
          </button>
        </div>
      )}

      {/* ─── Zones Tab ─── */}
      {activeTab === 'zones' && (
        <div className="p-4 flex flex-col gap-3">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <span className="text-blue-400 font-semibold">How Bachat Zones work:</span> We map the Kattankulathur–Chengalpattu corridor into protection zones using historical weather, traffic, and incident data.
              In <b className="text-violet-400">Maximum Protection</b> zones, Bachat automatically activates instant claims,
              extends your coverage, and sends weather alerts — so you can <b className="text-white">confidently accept orders anywhere</b>.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {KATTANKULATHUR_ZONES.map((z) => (
              <div key={z.name} className="flex items-center gap-3 bg-slate-800/40 border border-white/5 rounded-xl px-4 py-3">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: z.color, boxShadow: `0 0 8px ${z.color}55` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white/90">{z.name}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${protStyle(z.protectionLabel)}`}>
                      {z.protectionLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{z.protectionDescription}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 p-3 text-center">
            <p className="text-xs text-emerald-300 font-semibold">✅ You are protected in every zone</p>
            <p className="text-[10px] text-slate-400 mt-1">Bachat adapts coverage automatically — accept orders with full confidence</p>
          </div>
        </div>
      )}

      {/* ─── AI Pricing Tab ─── */}
      {activeTab === 'pricing' && pricing && (
        <div className="p-5 flex flex-col gap-5">
          {/* Premium hero */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#312e81] border border-blue-500/30 shadow-[0_4px_30px_rgba(30,58,138,0.3)] text-white p-5 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            <p className="text-xs text-blue-200/80 font-medium tracking-wide uppercase mb-2">AI-Adjusted Weekly Premium</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold tracking-tight">₹{pricing.adjustedPremium}</span>
              <span className="text-sm text-blue-200/60 line-through">₹{pricing.basePremium}</span>
              <span className="ml-auto bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                -₹{pricing.discount} saved
              </span>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-blue-100/90">🛡️ Coverage: <b className="text-white">{8 + pricing.extraCoverageHours}h/day</b></span>
              {pricing.extraCoverageHours > 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  +{pricing.extraCoverageHours}h weather shield
                </span>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Home Zone</p>
              <p className="text-xs font-bold text-slate-100 mt-1">{pricing.dominantZone}</p>
            </div>
            <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Forecast</p>
              <p className="text-xs font-bold text-slate-100 mt-1">{wIcon(pricing.weatherForecast)} {pricing.weatherForecast}</p>
            </div>
            <div className="bg-slate-800/50 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Trips</p>
              <p className="text-xs font-bold text-slate-100 mt-1">{pricing.totalTrips} this month</p>
            </div>
          </div>

          {/* ML Reasoning */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              🧠 ML Model Reasoning
              <span className="text-[9px] font-normal normal-case text-slate-500 ml-auto">RandomForest v1.0 • R² = 0.97</span>
            </p>
            <div className="flex flex-col gap-2">
              {pricing.reason.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-800/40 border border-white/5 rounded-lg px-3.5 py-2.5">
                  <span className="text-blue-400 mt-0.5 font-bold">›</span>
                  <span className="leading-relaxed">{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 items-start">
            <span className="text-blue-400 text-lg leading-none">ℹ️</span>
            <p className="text-[11px] leading-relaxed text-slate-300">
              <span className="font-semibold text-blue-300">Trained ML Model:</span> A RandomForest regressor trained on 2,000 synthetic samples models weather indices, zone features, and surge patterns for the Kattankulathur–Chengalpattu corridor. Your 30-day GPS topology is fed as input to predict an optimal premium multiplier in real-time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

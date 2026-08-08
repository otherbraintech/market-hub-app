"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface InteractiveMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  city?: string;
  address?: string;
  googleMapsUrl?: string;
  onLocationChange: (data: {
    address: string;
    city: string;
    googleMapsUrl: string;
    lat: number;
    lng: number;
  }) => void;
}

// Coordenadas por defecto para Bolivia (por ciudad)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Santa Cruz de la Sierra": { lat: -17.7833, lng: -63.1821 },
  "La Paz": { lat: -16.5000, lng: -68.1500 },
  "El Alto": { lat: -16.5000, lng: -68.1900 },
  "Cochabamba": { lat: -17.3895, lng: -66.1568 },
  "Sucre": { lat: -19.0333, lng: -65.2627 },
  "Tarija": { lat: -21.5355, lng: -64.7296 },
  "Oruro": { lat: -17.9833, lng: -67.1500 },
  "Potosí": { lat: -19.5833, lng: -65.7500 },
  "Trinidad (Beni)": { lat: -14.8333, lng: -64.9000 },
  "Cobija (Pando)": { lat: -11.0267, lng: -68.7692 },
};

function parseCoordsFromUrl(url?: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const match = url.match(/q=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/) || url.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  return null;
}

export function InteractiveMapPicker({
  initialLat,
  initialLng,
  city = "Santa Cruz de la Sierra",
  address = "",
  googleMapsUrl = "",
  onLocationChange,
}: InteractiveMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentAddress, setCurrentAddress] = useState(address);
  const [currentCity, setCurrentCity] = useState(city);
  const [currentGoogleMapsUrl, setCurrentGoogleMapsUrl] = useState(googleMapsUrl);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => {
    if (initialLat && initialLng) return { lat: initialLat, lng: initialLng };
    const parsed = parseCoordsFromUrl(googleMapsUrl);
    if (parsed) return parsed;
    const cityCoords = CITY_COORDINATES[city] || CITY_COORDINATES["Santa Cruz de la Sierra"];
    return cityCoords;
  });

  // Cargar CSS de Leaflet de forma dinámica si no está presente
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Función para reverse geocoding vía Nominatim (Gratuito / Sin API Key)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "es",
            "User-Agent": "OB-MarketHub-MapPicker/1.0",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || "";
          const houseNum = addr.house_number ? ` #${addr.house_number}` : "";
          const area = addr.suburb || addr.neighbourhood || addr.city_district || "";
          
          let formattedAddress = [road + houseNum, area].filter(Boolean).join(", ");
          if (!formattedAddress) formattedAddress = data.display_name?.split(",").slice(0, 3).join(",") || "";

          // Detectar ciudad si está presente
          let detectedCity = currentCity;
          const cityCandidate = addr.city || addr.town || addr.village || addr.county;
          if (cityCandidate) {
            const matchedKey = Object.keys(CITY_COORDINATES).find((c) =>
              c.toLowerCase().includes(cityCandidate.toLowerCase())
            );
            if (matchedKey) detectedCity = matchedKey;
          }

          const gMapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

          setCurrentAddress(formattedAddress);
          setCurrentCity(detectedCity);
          setCurrentGoogleMapsUrl(gMapsUrl);

          onLocationChange({
            address: formattedAddress,
            city: detectedCity,
            googleMapsUrl: gMapsUrl,
            lat,
            lng,
          });

          toast.success("📍 Dirección capturada del mapa.");
          return;
        }
      }
    } catch (e) {
      console.warn("Reverse geocoding warning:", e);
    }

    const fallbackGMapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
    setCurrentGoogleMapsUrl(fallbackGMapsUrl);
    onLocationChange({
      address: currentAddress || `Ubicación en mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      city: currentCity,
      googleMapsUrl: fallbackGMapsUrl,
      lat,
      lng,
    });
  };

  // Inicialización del Mapa Leaflet
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Fix de iconos por defecto de Leaflet en Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Crear pin arrastrable
      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
      }).addTo(map);

      marker.bindPopup("<b>📍 Pin de Ubicación</b><br/>Arrastra o haz clic en el mapa para ajustar.").openPopup();

      // Evento al arrastrar el pin
      marker.on("dragend", async () => {
        const position = marker.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });

        const instantGMapsUrl = `https://www.google.com/maps?q=${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
        setCurrentGoogleMapsUrl(instantGMapsUrl);
        onLocationChange({
          address: currentAddress || "",
          city: currentCity,
          googleMapsUrl: instantGMapsUrl,
          lat: position.lat,
          lng: position.lng,
        });

        await reverseGeocode(position.lat, position.lng);
      });

      // Evento al hacer clic en cualquier parte del mapa
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });

        const instantGMapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
        setCurrentGoogleMapsUrl(instantGMapsUrl);
        onLocationChange({
          address: currentAddress || "",
          city: currentCity,
          googleMapsUrl: instantGMapsUrl,
          lat,
          lng,
        });

        await reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Mover el mapa cuando cambia la ciudad seleccionada si no hay lat/lng fija
  useEffect(() => {
    if (mapInstanceRef.current && CITY_COORDINATES[city]) {
      const cityCoords = CITY_COORDINATES[city];
      mapInstanceRef.current.setView([cityCoords.lat, cityCoords.lng], 14);
      if (markerRef.current) {
        markerRef.current.setLatLng([cityCoords.lat, cityCoords.lng]);
      }
      setCoords(cityCoords);
    }
  }, [city]);

  // Búsqueda por texto (Geocoding de lugares)
  const handleSearchLocation = async () => {
    const term = searchQuery.trim() || `${currentAddress} ${city} Bolivia`.trim();
    if (!term) return;

    setLoadingSearch(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1`,
        {
          headers: {
            "Accept-Language": "es",
            "User-Agent": "OB-MarketHub-MapPicker/1.0",
          },
        }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);

          setCoords({ lat, lng });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 16);
          }
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }

          await reverseGeocode(lat, lng);
          toast.success("🔍 Ubicación encontrada en el mapa.");
        } else {
          toast.error("No se encontraron resultados para esta búsqueda.");
        }
      }
    } catch (e) {
      toast.error("Error al buscar lugar en el mapa.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // Obtener posición por GPS del navegador
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización GPS.");
      return;
    }

    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setCoords({ lat, lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }

        await reverseGeocode(lat, lng);
        setLoadingGps(false);
        toast.success("🎯 Ubicación GPS obtenida con éxito.");
      },
      (err) => {
        setLoadingGps(false);
        toast.error("No se pudo obtener tu ubicación GPS (Permiso denegado).");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Barra Superior con Búsqueda y Botón GPS */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar zona, calle, comercio o lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchLocation())}
            className="h-9 pl-9 pr-20 text-xs rounded-xl bg-background border-slate-200 focus-visible:ring-indigo-500"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSearchLocation}
            disabled={loadingSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2.5 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            {loadingSearch ? <Loader2 className="h-3 w-3 animate-spin" /> : "Buscar"}
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseGps}
          disabled={loadingGps}
          className="h-9 px-3 text-xs font-bold gap-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shrink-0 rounded-xl"
        >
          {loadingGps ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5 text-indigo-500" />}
          <span>Mi GPS</span>
        </Button>
      </div>

      {/* Contenedor del Mapa Interactivo Leaflet */}
      <div className="relative h-[250px] w-full rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-900 shadow-sm z-0">
        <div ref={mapContainerRef} className="w-full h-full" />

        <div className="absolute bottom-2 left-2 z-[400] bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-lg border text-[10px] font-bold text-foreground shadow-sm flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-indigo-500 animate-pulse" />
          <span>Haz clic o arrastra el pin 📍 en el mapa</span>
        </div>
      </div>

      {/* Indicador de Google Maps URL generada */}
      {currentGoogleMapsUrl && (
        <div className="flex items-center justify-between gap-2 p-2 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-[11px]">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200 truncate flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">{currentGoogleMapsUrl}</span>
          </span>
          <a
            href={currentGoogleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-extrabold text-indigo-600 hover:underline shrink-0 flex items-center gap-0.5"
          >
            Ver en Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

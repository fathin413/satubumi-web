"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPreviewProps {
  geometry: any;
  className?: string;
}

function MapController({ geometry }: { geometry: any }) {
  const map = useMap();
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    // Force Leaflet to recalculate container size so tiles fill 100% of the card
    const handleResize = () => {
      map.invalidateSize();
    };

    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 300);
    const t3 = setTimeout(handleResize, 600);
    const t4 = setTimeout(handleResize, 1200);

    // Watch for parent container resize via ResizeObserver
    const container = map.getContainer();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(container);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("resize", handleResize);
      if (ro && container) ro.unobserve(container);
    };
  }, [map]);

  useEffect(() => {
    if (!geometry || !map) return;

    try {
      const geoLayer = L.geoJSON(geometry);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
        hasFitRef.current = true;
      }
    } catch {
      // ignore
    }
  }, [geometry, map]);

  return null;
}

export default function MapPreview({ geometry, className = "" }: MapPreviewProps) {
  if (!geometry) return null;

  return (
    <div className={`w-full h-full min-h-[350px] relative overflow-hidden z-0 flex flex-col ${className}`}>
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        className="w-full h-full flex-1"
        style={{ height: "100%", width: "100%", minHeight: "350px" }}
        scrollWheelZoom={false}
      >
        <MapController geometry={geometry} />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={geometry}
          style={() => ({
            color: "#059669",
            weight: 2.5,
            fillColor: "#10b981",
            fillOpacity: 0.35,
          })}
          eventHandlers={{
            add: (e) => {
              const layer = e.target;
              try {
                const bounds = layer.getBounds();
                if (bounds && bounds.isValid()) {
                  layer._map.fitBounds(bounds, { padding: [28, 28] });
                  setTimeout(() => {
                    layer._map.invalidateSize();
                  }, 200);
                }
              } catch {
                // ignore
              }
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
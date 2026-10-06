"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { Tour } from "@/types";
import { getTourCoords, type LatLng } from "@/lib/geo";
import { formatCurrency } from "@/lib/utils";

const defaultIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-emerald.png",
  shadowUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Recenter({ center, zoom }: { center: LatLng; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom ?? map.getZoom(), {
      animate: true,
    });
  }, [center.lat, center.lng, zoom, map]);
  return null;
}

function FitBounds({
  points,
  padding = 40,
}: {
  points: LatLng[];
  padding?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [padding, padding] });
  }, [points, padding, map]);
  return null;
}

interface TourMapProps {
  tours: Tour[];
  center: LatLng;
  userCoords?: LatLng | null;
  radiusKm?: number;
  height?: string;
  onSelectTour?: (tour: Tour) => void;
}

export default function TourMap({
  tours,
  center,
  userCoords,
  radiusKm,
  height = "560px",
  onSelectTour,
}: TourMapProps) {
  const markers = useMemo(
    () =>
      tours
        .map((t) => {
          const coords = getTourCoords(t.location);
          return coords ? { tour: t, coords } : null;
        })
        .filter((x): x is { tour: Tour; coords: LatLng } => x !== null),
    [tours],
  );

  const points = useMemo(() => {
    const pts = markers.map((m) => m.coords);
    if (userCoords) pts.push(userCoords);
    return pts;
  }, [markers, userCoords]);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm"
      style={{ height }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={10}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Recenter center={center} />
        {points.length > 1 && <FitBounds points={points} />}

        {userCoords && (
          <>
            <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
              <Popup>
                <strong>You are here</strong>
              </Popup>
            </Marker>
            {radiusKm && (
              <Circle
                center={[userCoords.lat, userCoords.lng]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "#059669",
                  fillColor: "#10b981",
                  fillOpacity: 0.08,
                  weight: 1,
                }}
              />
            )}
          </>
        )}

        {markers.map(({ tour, coords }) => (
          <Marker
            key={tour._id}
            position={[coords.lat, coords.lng]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => onSelectTour?.(tour),
            }}
          >
            <Popup>
              <div className="min-w-50">
                <p className="text-sm font-semibold text-gray-900">
                  {tour.name}
                </p>
                {tour.location?.city && (
                  <p className="text-xs text-gray-500">
                    {tour.location.city}
                    {tour.location.country ? `, ${tour.location.country}` : ""}
                  </p>
                )}
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {formatCurrency(tour.price)}
                </p>
                <Link
                  href={`/tours/${tour.slug}`}
                  className="mt-2 inline-block rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  View tour →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

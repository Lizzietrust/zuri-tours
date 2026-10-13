import { api } from "@/lib/api";

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
  type?: string;
  bbox?: number[] | null;
}

export const geocodeService = {
  async search(q: string): Promise<GeocodeResult> {
    const { data } = await api.get<{
      status: string;
      data: GeocodeResult;
    }>("/geocode", { params: { q } });

    return data.data;
  },
};

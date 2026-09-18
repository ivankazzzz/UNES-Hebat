export type BuildingId =
  | "rektorat"
  | "gedung-e"
  | "gedung-a"
  | "fkip"
  | "hukum"
  | "pascasarjana"
  | "bebas";

export interface Building {
  id: BuildingId;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
}

export const BUILDINGS: ReadonlyArray<Building> = [
  {
    id: "rektorat",
    name: "Gedung Rektorat Universitas Ekasakti",
    shortName: "Rektorat",
    lat: -0.937557,
    lng: 100.356313,
  },
  {
    id: "gedung-e",
    name: "Gedung E Universitas Ekasakti",
    shortName: "Gedung E",
    lat: -0.9382539,
    lng: 100.3562233,
  },
  {
    id: "gedung-a",
    name: "Gedung A Universitas Ekasakti",
    shortName: "Gedung A",
    lat: -0.9387835,
    lng: 100.3561079,
  },
  {
    id: "fkip",
    name: "Gedung FKIP UNES",
    shortName: "FKIP",
    lat: -0.938672,
    lng: 100.355711,
  },
  {
    id: "hukum",
    name: "Gedung Fakultas Hukum UNES",
    shortName: "Fak. Hukum",
    lat: -0.9372603,
    lng: 100.3558069,
  },
  {
    id: "pascasarjana",
    name: "Gedung Pascasarjana Universitas Ekasakti",
    shortName: "Pascasarjana",
    lat: -0.9418623,
    lng: 100.3559994,
  },
  {
    id: "bebas",
    name: "Bebas",
    shortName: "Bebas",
    lat: 0,
    lng: 0,
  },
] as const;

const BUILDING_BY_ID = BUILDINGS.reduce((acc, b) => {
  acc[b.id] = b;
  return acc;
}, {} as Record<BuildingId, Building>);

export function getBuildingById(id: BuildingId): Building {
  const building = BUILDING_BY_ID[id];
  if (!building) throw new Error(`Building not found: ${id}`);
  return building;
}

export function resolveBuildingIdFromLocationName(locationName: string | null): BuildingId | null {
  if (!locationName) return null;
  const value = locationName.toLowerCase();

  if (value.includes("bebas")) return "bebas";
  if (value.includes("gedung e")) return "gedung-e";
  if (value.includes("gedung a")) return "gedung-a";
  if (value.includes("rektorat")) return "rektorat";
  if (value.includes("fkip")) return "fkip";
  if (value.includes("fakultas hukum") || value.includes("fak. hukum")) return "hukum";
  if (value.includes("pascasarjana")) return "pascasarjana";

  return null;
}

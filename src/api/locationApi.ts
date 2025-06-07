import axios from "axios";
import type { CountryDTO } from "../types/CountryDTO";
import type { StateDTO } from "../types/StateDTO";
import type { DistrictDTO } from "../types/DistrictDTO";

export const fetchCountries = async (): Promise<CountryDTO[]> => {
  const res = await axios.get("/api/Location/Get-All-Countries");
  console.log("✅ API Raw Countries Response:", res.data);
  if (!Array.isArray(res.data)) {
    console.error("❌ Countries API did not return an array", res.data);
    return [];
  }
  return res.data;
};


export const fetchStatesByCountryId = async (countryId: number): Promise<StateDTO[]> => {
  const res = await axios.get<StateDTO[]>(`/api/Location/Get-States-By-CountryId/${countryId}`);
  return res.data;
};

export const fetchDistrictsByStateId = async (stateId: number): Promise<DistrictDTO[]> => {
  const res = await axios.get<DistrictDTO[]>(`/api/Location/Get-Districts-By-StateId/${stateId}`);
  return res.data;
};

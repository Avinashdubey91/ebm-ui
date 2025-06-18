// 📁 src/hooks/useLocationDropdowns.ts
import { useEffect, useState } from "react";
import { fetchCountries, fetchStatesByCountryId, fetchDistrictsByStateId } from "../api/locationApi";
import type { CountryDTO } from "../types/CountryDTO";
import type { StateDTO } from "../types/StateDTO";
import type { DistrictDTO } from "../types/DistrictDTO";

export function useLocationDropdowns(countryId?: number, stateId?: number) {
  const [countries, setCountries] = useState<CountryDTO[]>([]);
  const [states, setStates] = useState<StateDTO[]>([]);
  const [districts, setDistricts] = useState<DistrictDTO[]>([]);

  useEffect(() => {
    fetchCountries().then(setCountries).catch(console.error);
  }, []);

  useEffect(() => {
    if (countryId) {
      fetchStatesByCountryId(countryId).then(setStates).catch(console.error);
    } else {
      setStates([]);
    }
  }, [countryId]);

  useEffect(() => {
    if (stateId) {
      fetchDistrictsByStateId(stateId).then(setDistricts).catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [stateId]);

  return { countries, states, districts };
}

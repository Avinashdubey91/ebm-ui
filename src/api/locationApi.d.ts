import type { CountryDTO } from "../types/CountryDTO";
import type { StateDTO } from "../types/StateDTO";
import type { DistrictDTO } from "../types/DistrictDTO";
export declare const fetchCountries: () => Promise<CountryDTO[]>;
export declare const fetchStatesByCountryId: (countryId: number) => Promise<StateDTO[]>;
export declare const fetchDistrictsByStateId: (stateId: number) => Promise<DistrictDTO[]>;

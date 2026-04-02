import type { CountryDTO } from "../types/CountryDTO";
import type { StateDTO } from "../types/StateDTO";
import type { DistrictDTO } from "../types/DistrictDTO";
export declare function useLocationDropdowns(countryId?: number, stateId?: number): {
    countries: CountryDTO[];
    states: StateDTO[];
    districts: DistrictDTO[];
};

import type { NavigateOptions, To } from "react-router-dom";
export declare const useGuardedNavigate: () => (to: To, options?: NavigateOptions) => Promise<boolean>;

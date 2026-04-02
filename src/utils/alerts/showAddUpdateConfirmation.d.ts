type Action = "add" | "update" | "error";
/** Keep confirmation disabled (as before) */
export declare const showAddUpdateConfirmation: () => Promise<boolean>;
/** Form mode: show center modal + prime toast for next page */
export declare function showAddUpdateResult(success: boolean, action: Action, entityName?: string, customMessage?: string, titleOverride?: string): Promise<void>;
/** Toast-only mode (listing): compatible with showDeleteResult signature */
export declare function showAddUpdateResult(success: boolean, entityName?: string, customMessage?: string, titleOverride?: string, showToastOnly?: boolean): Promise<void>;
export {};

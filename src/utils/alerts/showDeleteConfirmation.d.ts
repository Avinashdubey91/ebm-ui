import type { SweetAlertIcon } from "sweetalert2";
export type ActionConfirmationOptions = {
    title?: string;
    text: string;
    icon?: SweetAlertIcon;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonColor?: string;
};
/**
 * Generic confirmation dialog (same UI style as delete, but customizable text/buttons)
 */
export declare const showActionConfirmation: (options: ActionConfirmationOptions) => Promise<boolean>;
/**
 * Delete confirmation (kept as-is for listing delete flow)
 */
export declare const showDeleteConfirmation: (entityName?: string) => Promise<boolean>;
/**
 * Delete result toast/modal (used by listing pages)
 */
export declare const showDeleteResult: (success: boolean, entityName?: string, customMessage?: string, titleOverride?: string, showToastOnly?: boolean) => Promise<void>;

// src/utils/alerts/showDeleteConfirmation.ts
import Swal from "sweetalert2";
import type { SweetAlertIcon, SweetAlertOptions } from "sweetalert2";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
export const showActionConfirmation = async (
  options: ActionConfirmationOptions
): Promise<boolean> => {
  const swalOptions: SweetAlertOptions = {
    icon: options.icon ?? "warning",
    title: options.title ?? "Are you sure?",
    text: options.text,
    showCancelButton: true,
    confirmButtonColor: options.confirmButtonColor ?? "#e74c3c",
    cancelButtonColor: options.cancelButtonColor ?? "#aaa",
    confirmButtonText: options.confirmButtonText ?? "Confirm",
    cancelButtonText: options.cancelButtonText ?? "Cancel",
    allowOutsideClick: false,
  };

  const result = await Swal.fire(swalOptions);
  return result.isConfirmed === true;
};

/**
 * Delete confirmation (kept as-is for listing delete flow)
 */
export const showDeleteConfirmation = async (
  entityName = "item"
): Promise<boolean> =>
  showActionConfirmation({
    icon: "warning",
    title: "Are you sure?",
    text: `Do you really want to delete this ${entityName}? This action cannot be undone.`,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#e74c3c",
    cancelButtonColor: "#aaa",
  });

/**
 * Delete result toast/modal (used by listing pages)
 */
export const showDeleteResult = async (
  success: boolean,
  entityName = "item",
  customMessage?: string,
  titleOverride?: string,
  showToastOnly = true
): Promise<void> => {
  const title = titleOverride || (success ? "Deleted" : "Error!");
  const message =
    customMessage ||
    (success
      ? `${cap(entityName)} deleted successfully.`
      : `Failed to delete ${entityName}.`);

  const commonOptions: SweetAlertOptions = {
    icon: success ? "success" : "error",
    title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
  };

  if (showToastOnly) {
    await Swal.fire({
      ...commonOptions,
      toast: true,
      position: "top-end",
    });
  } else {
    await Swal.fire(commonOptions);
  }
};
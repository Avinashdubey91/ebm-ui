import Swal from "sweetalert2";
import type { SweetAlertOptions } from "sweetalert2"; // ✅ Correct type import

/**
 * Shows a standard delete confirmation dialog using SweetAlert2.
 */
export const showDeleteConfirmation = async (entityName = "item"): Promise<boolean> => {
  const result = await Swal.fire({
    icon: "warning",
    title: "Are you sure?",
    text: `Do you really want to delete this ${entityName}? This action cannot be undone.`,
    showCancelButton: true,
    confirmButtonColor: "#e74c3c",
    cancelButtonColor: "#aaa",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  return result.isConfirmed;
};

/**
 * Shows a SweetAlert result (toast or modal) after delete (or any action).
 */
export const showDeleteResult = async (
  success: boolean,
  entityName = "item",
  customMessage?: string,
  titleOverride?: string,
  showToastOnly: boolean = true
) => {
  const capitalizedEntity = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const title = titleOverride || (success ? "Deleted!" : "Error!");
  const message = customMessage
    ? customMessage
    : success
    ? `${capitalizedEntity} has been deleted successfully.`
    : `Failed to delete the ${entityName}.`;

  const commonOptions: SweetAlertOptions = {
    icon: success ? "success" : "error",
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    background: "#fff",
    iconColor: success ? "#28a745" : "#e74c3c",
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

import Swal from "sweetalert2";

/**
 * Shows a standard delete confirmation dialog using SweetAlert2.
 * @param entityName The name of the entity (e.g., "user", "society") for context
 * @returns A Promise that resolves to true if confirmed, false otherwise
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
 * Shows a toast-style success or error message after delete.
 */
export const showDeleteResult = async (
  success: boolean,
  entityName = "item",
  customMessage?: string,
  titleOverride?: string // ✅ optional custom title
) => {
  await Swal.fire({
    icon: success ? "success" : "error",
    title: titleOverride || (success ? "Deleted!" : "Error!"), // ✅ fallback
    text: customMessage
      ? customMessage
      : success
        ? `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} has been deleted.`
        : `Failed to delete the ${entityName}.`,
    confirmButtonColor: success ? "#28a745" : "#e74c3c",
  });
};


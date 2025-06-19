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
 * Shows a SweetAlert and toast-style result after delete operation.
 */
export const showDeleteResult = async (
  success: boolean,
  entityName = "item",
  customMessage?: string,
  titleOverride?: string
) => {
  const capitalizedEntity = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const defaultTitle = titleOverride || (success ? "Deleted!" : "Error!");
  const defaultMessage = customMessage
    ? customMessage
    : success
      ? `${capitalizedEntity} has been deleted successfully.`
      : `Failed to delete the ${entityName}.`;

  // ✅ Centered SWAL (no OK button)
  await Swal.fire({
    icon: success ? "success" : "error",
    title: defaultTitle,
    text: defaultMessage,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    background: "#fff",
    iconColor: success ? "#28a745" : "#e74c3c",
  });

  // ✅ Toast
  await Swal.fire({
    icon: success ? "success" : "error",
    title: defaultTitle,
    text: defaultMessage,
    toast: true,
    position: "top-end",
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    background: "#fff",
    iconColor: success ? "#28a745" : "#e74c3c",
  });
};

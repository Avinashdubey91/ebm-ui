import Swal from "sweetalert2";

/**
 * (Disabled) Shows a confirmation dialog before adding or updating an entity.
 * You can re-enable this later by uncommenting the Swal.fire block.
 */
export const showAddUpdateConfirmation = async (
//   action: "add" | "update" | "error",
//   entityName = "item"
): Promise<boolean> => {
  // Disabled for now — just proceed as confirmed
  return true;

  /*
  const isAdd = action === "add";
  const capitalizedAction = isAdd ? "Add" : "Update";

  const result = await Swal.fire({
    icon: "question",
    title: `Are you sure you want to ${action}?`,
    text: `Do you really want to ${action} this ${entityName}?`,
    showCancelButton: true,
    confirmButtonColor: isAdd ? "#28a745" : "#007bff",
    cancelButtonColor: "#aaa",
    confirmButtonText: capitalizedAction,
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  return result.isConfirmed;
  */
};

/**
 * Shows a center modal (no OK button) after add/update,
 * and sets up a toast for listing page after redirect.
 */
export const showAddUpdateResult = async (
  success: boolean,
  action: "add" | "update" | "error",
  entityName = "item",
  customMessage?: string,
  titleOverride?: string
) => {
  const capitalizedEntity = entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const pastTense = action === "add" ? "added" : "updated";

  if (success) {
    // ✅ SweetAlert modal (center, auto-dismiss, no OK)
    await Swal.fire({
      icon: "success",
      title: titleOverride || `${capitalizedEntity} ${pastTense}`,
      text:
        customMessage ||
        `${capitalizedEntity} has been ${pastTense} successfully.`,
      timer: 2000,
      showConfirmButton: false,
      background: "#fff",
      iconColor: "#28a745",
    });

    // ✅ Set up toast for listing page
    sessionStorage.setItem("showToast", `${capitalizedEntity} ${pastTense} successfully.`);
  } else {
    // ❌ Show error modal
    await Swal.fire({
      icon: "error",
      title: titleOverride || "Error!",
      text: customMessage || `Failed to ${action} the ${entityName}.`,
      confirmButtonColor: "#e74c3c",
    });
  }
};

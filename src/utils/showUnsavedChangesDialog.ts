// src/utils/showUnsavedChangesDialog.ts
import Swal from "sweetalert2";

export async function showUnsavedChangesDialog(): Promise<boolean> {
  const result = await Swal.fire({
    title: "Unsaved Changes",
    text: "You have unsaved changes. Are you sure you want to leave this page?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Leave Anyway",
    cancelButtonText: "Stay Here",
  });

  return result.isConfirmed;
}

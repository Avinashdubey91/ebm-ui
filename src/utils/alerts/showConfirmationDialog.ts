import Swal from "sweetalert2";

export type ConfirmationDialogOptions = {
  title: string;
  text?: string;
  html?: string;
  icon?: "warning" | "info" | "question" | "error" | "success";
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
};

export async function showConfirmationDialog(
  options: ConfirmationDialogOptions,
): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title,
    text: options.text,
    html: options.html,
    icon: options.icon ?? "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? "Yes",
    cancelButtonText: options.cancelButtonText ?? "No",
    confirmButtonColor: options.confirmButtonColor ?? "#28a745",
    cancelButtonColor: options.cancelButtonColor ?? "#6c757d",
  });

  return result.isConfirmed;
}
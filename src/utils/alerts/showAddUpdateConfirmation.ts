// src/utils/alerts/showAddUpdateConfirmation.ts
import Swal from "sweetalert2";

type Action = "add" | "update" | "error";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const putToast = (msg: string, title: string, type: "success" | "error") => {
  sessionStorage.setItem("showToast", msg);
  sessionStorage.setItem("showToastTitle", title);
  sessionStorage.setItem("showToastType", type);
};

const clearToast = () => {
  ["showToast", "showToastTitle", "showToastType"].forEach((k) =>
    sessionStorage.removeItem(k)
  );
};

/** Keep confirmation disabled (as before) */
export const showAddUpdateConfirmation = async (): Promise<boolean> => true;

/* ---------- Overloads ---------- */
/** Form mode: show center modal + prime toast for next page */
export async function showAddUpdateResult(
  success: boolean,
  action: Action,
  entityName?: string,
  customMessage?: string,
  titleOverride?: string
): Promise<void>;

/** Toast-only mode (listing): compatible with showDeleteResult signature */
export async function showAddUpdateResult(
  success: boolean,
  entityName?: string,
  customMessage?: string,
  titleOverride?: string,
  showToastOnly?: boolean
): Promise<void>;

/* ---------- Impl ---------- */
export async function showAddUpdateResult(
  ...args:
    | [boolean, Action, string?, string?, string?] // form mode
    | [boolean, string?, string?, string?, boolean?] // toast-only mode
): Promise<void> {
  // Detect which overload we’re in by inspecting the second arg
  const second = args[1];

  const isFormMode =
    typeof second === "string" &&
    (second === "add" || second === "update" || second === "error");

  if (isFormMode) {
    // -------- Form mode (called from Add/Edit page) --------
    const [success, action, entityName = "item", customMessage, titleOverride] =
      args as [boolean, Action, string?, string?, string?];

    const entity = cap(entityName);
    const past =
      action === "add" ? "added" : action === "update" ? "updated" : "processed";

    if (success) {
      const title = titleOverride || `${entity} ${past}`;
      const message =
        customMessage || `${entity} has been ${past} successfully.`;

      // Center modal right away
      await Swal.fire({
        icon: "success",
        title,
        text: message,
        timer: 2000,
        showConfirmButton: false,
      });

      // Prime toast for the listing page
      putToast(message, title, "success");
    } else {
      const title = titleOverride || "Error!";
      const message = customMessage || `Failed to ${action} the ${entityName}.`;

      await Swal.fire({
        icon: "error",
        title,
        text: message,
        confirmButtonText: "OK",
      });

      putToast(message, title, "error");
    }
    return;
  }

  // -------- Toast-only mode (called from Listing page) --------
  // Signature compatible with showDeleteResult(success, entityName, customMessage, titleOverride, showToastOnly?)
  const [
    success,
    entityName,
    customMessage,
    titleOverride,
    showToastOnly = true,
  ] = args as [boolean, string?, string?, string?, boolean?];

  // Prefer provided values; fall back to primed session values; then neutral defaults
  const primedMsg = sessionStorage.getItem("showToast") || "";
  const primedTitle = sessionStorage.getItem("showToastTitle") || "";
  const primedType = (sessionStorage.getItem("showToastType") ||
    (success ? "success" : "error")) as "success" | "error";

  const title =
    titleOverride ||
    primedTitle ||
    (success ? "Success" : "Error!");
  const message =
    customMessage ||
    primedMsg ||
    (success
      ? `${cap(entityName ?? "Item")} saved successfully.`
      : `Operation failed.`);

  const options = {
    icon: primedType,
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
  } as const;

  if (showToastOnly) {
    await Swal.fire({
      ...options,
      toast: true,
      position: "top-end",
    });
  } else {
    await Swal.fire(options);
  }

  clearToast();
}

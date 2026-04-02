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
export declare function showConfirmationDialog(options: ConfirmationDialogOptions): Promise<boolean>;

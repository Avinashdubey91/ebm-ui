import React from "react";
interface FileUploadFieldProps {
    name: string;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
}
declare const FileUploadField: React.FC<FileUploadFieldProps>;
export default FileUploadField;

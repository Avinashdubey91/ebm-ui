import React from "react";
import FormLabel from "./FormLabel";

interface FileUploadFieldProps {
  name: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>; // ✅ Corrected here
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  name,
  fileInputRef,
  onChange,
  label,
}) => (
  <div className="mb-2">
    <FormLabel label={label} htmlFor={name} />
    <input
      ref={fileInputRef}
      id={name}
      name={name}
      type="file"
      accept="image/*"
      className="form-control"
      onChange={onChange}
    />
  </div>
);

export default FileUploadField;

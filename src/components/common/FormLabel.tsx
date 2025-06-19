import React from 'react';

interface FormLabelProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
  className?: string; // ✅ optional custom class support
}

const FormLabel: React.FC<FormLabelProps> = ({
  label,
  required = false,
  htmlFor,
  className,
}) => (
  <label htmlFor={htmlFor} className={className ?? "form-label fw-semibold"}>
    {label} {required && <span className="text-danger">*</span>}
  </label>
);

export default FormLabel;

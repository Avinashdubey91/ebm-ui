import React from 'react';

interface FormLabelProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({ label, required = false, htmlFor }) => (
  <label htmlFor={htmlFor} className="form-label fw-semibold">
    {label} {required && <span className="text-danger">*</span>}
  </label>
);

export default FormLabel;

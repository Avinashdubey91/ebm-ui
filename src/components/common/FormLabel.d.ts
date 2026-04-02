import React from 'react';
interface FormLabelProps {
    label: string;
    required?: boolean;
    htmlFor?: string;
    className?: string;
}
declare const FormLabel: React.FC<FormLabelProps>;
export default FormLabel;

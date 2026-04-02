import React from "react";
interface CreateUserFormProps {
    userId?: number;
    onUnsavedChange?: (unsaved: boolean) => void;
}
declare const CreateUserForm: React.FC<CreateUserFormProps>;
export default CreateUserForm;

import React from "react";
import type { AddEditFormHandle } from "./SharedAddEditForm";
type SharedAddEditPageProps<TParam extends string, TFormProps extends Record<string, unknown>> = {
    idParamName: TParam;
    FormComponent: React.ForwardRefExoticComponent<React.PropsWithoutRef<TFormProps & {
        onUnsavedChange: (changed: boolean) => void;
    }> & React.RefAttributes<AddEditFormHandle>>;
    mapParamToProp?: (id: number) => Partial<TFormProps>;
};
declare const SharedAddEditPage: <TParam extends string, TFormProps extends Record<string, unknown>>({ idParamName, FormComponent, mapParamToProp, }: SharedAddEditPageProps<TParam, TFormProps>) => import("react/jsx-runtime").JSX.Element;
export default SharedAddEditPage;

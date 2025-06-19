import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { AddEditFormHandle } from "./SharedAddEditForm";

type SharedAddEditPageProps<
  TParam extends string,
  TFormProps extends Record<string, unknown>
> = {
  idParamName: TParam;
  FormComponent: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<TFormProps & { onUnsavedChange: (changed: boolean) => void }> &
      React.RefAttributes<AddEditFormHandle>
  >;
  mapParamToProp?: (id: number) => Partial<TFormProps>; // ✅ add this
};

const SharedAddEditPage = <
  TParam extends string,
  TFormProps extends Record<string, unknown>
>({
  idParamName,
  FormComponent,
  mapParamToProp,
}: SharedAddEditPageProps<TParam, TFormProps>) => {
  const { id } = useParams();
  const parsedId = id ? parseInt(id, 10) : undefined;

  const formRef = useRef<AddEditFormHandle>(null);
  const [, setHasUnsavedChanges] = useState(false);

  const formElement = React.createElement(FormComponent, {
    ...(parsedId !== undefined
      ? mapParamToProp?.(parsedId) ?? { [idParamName]: parsedId }
      : {}),
    onUnsavedChange: setHasUnsavedChanges,
    ref: formRef,
  } as unknown as React.ComponentPropsWithRef<typeof FormComponent>);

  return <div className="page-form">{formElement}</div>;
};

export default SharedAddEditPage;

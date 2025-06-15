import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  type FormEvent,
  type ReactNode,
} from "react";
import LoaderOverlay from "../../components/common/LoaderOverlay";
import { useFormNavigationGuard } from "../../hooks/useFormNavigationGuard";

export type FormField<T> = {
  key: keyof T;
  label: string;
  type: "text" | "email" | "select" | "date" | "number" | "file" | "custom";
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: string | number }[];
  customRender?: (
    formData: T,
    setFormData: React.Dispatch<React.SetStateAction<T>>
  ) => ReactNode;
};

type CreateFormWrapperProps<T> = {
  id?: number;
  initialState: T;
  fetchData?: (id: number) => Promise<T>;
  onSubmit: (formData: T | FormData, file?: File | null) => Promise<void>;
  buildFormData?: (formData: T, file?: File | null) => FormData;
  fields: FormField<T>[];
  children?: ReactNode;
  showFileUpload?: boolean;
  filePreview?: string | null;
};

function CreateFormWrapper<T>({
  id,
  initialState,
  fetchData,
  onSubmit,
  buildFormData,
  fields,
  children,
  showFileUpload = false,
  filePreview = null,
}: CreateFormWrapperProps<T>) {
  const [formData, setFormData] = useState<T>(initialState);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFormRef = useRef<T | null>(null);

  useEffect(() => {
    if (id && fetchData) {
      fetchData(id).then((data) => {
        setFormData(data);
        initialFormRef.current = data;
      });
    } else {
      initialFormRef.current = initialState;
    }
  }, [id, fetchData, initialState]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialFormRef.current) return false;

    return JSON.stringify(initialFormRef.current) !== JSON.stringify(formData);
  }, [formData]);

  useFormNavigationGuard(hasUnsavedChanges && !isSubmitting);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = buildFormData
        ? buildFormData(formData, file)
        : formData;

      await onSubmit(result, file);
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 position-relative">
      {isSubmitting && (
        <LoaderOverlay
          text="Saving..."
          spinnerClass="spinner-border text-primary"
        />
      )}
      <form
        onSubmit={handleSubmit}
        style={{
          pointerEvents: isSubmitting ? "none" : "auto",
          opacity: isSubmitting ? 0.6 : 1,
        }}
      >
        <div className="row">
          {fields.map((field, index) => {
            const rawValue = formData[field.key];
            const value: string | number | undefined =
              typeof rawValue === "string" || typeof rawValue === "number"
                ? rawValue
                : "";

            const colClass = "col-md-4 mb-2";

            if (field.customRender) {
              return (
                <div className={colClass} key={index}>
                  {field.customRender(formData, setFormData)}
                </div>
              );
            }

            if (field.type === "select") {
              return (
                <div className={colClass} key={index}>
                  <label htmlFor={String(field.key)} className="form-label">
                    {field.label}
                    {field.required && <span className="text-danger">*</span>}
                  </label>
                  <select
                    id={String(field.key)}
                    name={String(field.key)}
                    className="form-select"
                    value={value}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled}
                  >
                    <option value="">-- Select --</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div className={colClass} key={index}>
                <label htmlFor={String(field.key)} className="form-label">
                  {field.label}
                  {field.required && <span className="text-danger">*</span>}
                </label>
                <input
                  id={String(field.key)}
                  name={String(field.key)}
                  className="form-control"
                  value={value}
                  onChange={handleChange}
                  type={field.type}
                  disabled={field.disabled}
                  required={field.required}
                />
              </div>
            );
          })}

          {showFileUpload && (
            <div className="col-md-4 mb-2">
              <label htmlFor="upload" className="form-label">
                Upload File
              </label>
              <input
                id="upload"
                type="file"
                className="form-control"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              {filePreview && (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="mt-2"
                  style={{
                    width: "70px",
                    height: "70px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Custom Slot Elements (e.g. Suggestions, Extra Buttons) */}
        {children}

        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-outline-success">
            <i className="fa fa-save me-2"></i>Save
          </button>
          <button
            type="reset"
            className="btn btn-outline-danger"
            onClick={() => setFormData(initialState)}
          >
            <i className="fa fa-undo me-2"></i>Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateFormWrapper;

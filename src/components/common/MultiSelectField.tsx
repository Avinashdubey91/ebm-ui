import React, { useMemo } from "react";
import Select, {
  components,
  type MultiValue,
  type StylesConfig,
  type OptionProps,
  type MenuListProps,
} from "react-select";
import FormLabel from "./FormLabel";

export interface MultiSelectOption {
  label: string;
  value: string | number;
}

interface MultiSelectFieldProps {
  label: string;
  name: string;
  value: Array<string | number>;
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  required?: boolean;
  disabled?: boolean;
}

type RsOption = { label: string; value: string };

const toRsOptions = (opts: MultiSelectOption[]): RsOption[] =>
  opts.map((o) => ({ label: o.label, value: String(o.value) }));

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  name,
  value,
  options,
  onChange,
  required,
  disabled,
}) => {
  const rsOptions = useMemo(() => toRsOptions(options), [options]);

  const selected = useMemo(() => {
    const selectedSet = new Set(value.map(String));
    return rsOptions.filter((o) => selectedSet.has(o.value));
  }, [rsOptions, value]);

  const isAllSelected =
    rsOptions.length > 0 && selected.length === rsOptions.length;

  const selectAll = () => {
    if (disabled || rsOptions.length === 0) return;
    onChange(rsOptions.map((o) => o.value));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const styles: StylesConfig<RsOption, true> = {
    control: (base, state) => ({
      ...base,
      minHeight: "38px",
      borderRadius: "0.375rem",
      borderColor: state.isFocused
        ? "var(--bs-primary)"
        : "var(--bs-border-color)",
      boxShadow: state.isFocused
        ? "0 0 0 .25rem rgba(var(--bs-primary-rgb), .25)"
        : "none",
      backgroundColor: disabled
        ? "var(--bs-secondary-bg)"
        : "var(--bs-body-bg)",
      ":hover": {
        borderColor: state.isFocused
          ? "var(--bs-primary)"
          : "var(--bs-border-color)",
      },
    }),

    valueContainer: (base) => ({
      ...base,
      padding: "2px 8px",
      gap: "6px",
    }),

    multiValue: (base) => ({
      ...base,
      backgroundColor: "var(--bs-secondary-bg)",
      border: "1px solid var(--bs-border-color)",
      borderRadius: "0.25rem",
    }),

    multiValueLabel: (base) => ({
      ...base,
      color: "var(--bs-body-color)",
      fontSize: "0.95rem",
    }),

    multiValueRemove: (base) => ({
      ...base,
      cursor: "pointer",
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "var(--bs-tertiary-bg)"
        : "transparent",
      color: "var(--bs-body-color)",
      fontWeight: state.isSelected ? 600 : 400,
      ":active": {
        backgroundColor: "var(--bs-tertiary-bg)",
      },
    }),

    menu: (base) => ({
      ...base,
      zIndex: 10,
    }),

    menuList: (base) => ({
      ...base,
      paddingTop: 0,
    }),
  };

  const handleChange = (items: MultiValue<RsOption>) => {
    onChange(items.map((i) => i.value));
  };

  const CheckboxOption = (props: OptionProps<RsOption, true>) => {
    return (
      <components.Option {...props}>
        <div className="d-flex align-items-center gap-2">
          <input
            type="checkbox"
            className="form-check-input"
            checked={props.isSelected}
            readOnly
            style={{ pointerEvents: "none" }}
          />
          <span>{props.label}</span>
        </div>
      </components.Option>
    );
  };

  const MenuList = (props: MenuListProps<RsOption, true>) => {
    return (
      <components.MenuList {...props}>
        <div
          className="d-flex justify-content-between align-items-center px-2 py-2 border-bottom"
          style={{
            position: "sticky",
            top: 0,
            background: "var(--bs-body-bg)",
            zIndex: 1,
          }}
        >
          <small className="text-muted">Options</small>

          <div
            className="btn-group btn-group-sm"
            role="group"
            aria-label="Bulk actions"
          >
            <button
              type="button"
              className="btn btn-outline-primary"
              onMouseDown={(e) => e.preventDefault()}
              onClick={selectAll}
              disabled={disabled || rsOptions.length === 0 || isAllSelected}
            >
              Select all
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearAll}
              disabled={disabled || selected.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        {props.children}
      </components.MenuList>
    );
  };

  return (
    <div className="mb-2">
      <FormLabel label={label} htmlFor={name} required={required} />

      <Select<RsOption, true>
        inputId={name}
        instanceId={name}
        isMulti
        isDisabled={disabled}
        isSearchable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        options={rsOptions}
        value={selected}
        onChange={handleChange}
        styles={styles}
        placeholder="-- Select --"
        components={{ Option: CheckboxOption, MenuList }}
      />
    </div>
  );
};

export default MultiSelectField;

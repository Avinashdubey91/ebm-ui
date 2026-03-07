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
  showCountOnly?: boolean;
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
  showCountOnly,
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

  const placeholderText = useMemo(() => {
    if (showCountOnly && selected.length > 0) return `${selected.length} selected`;
    return "-- Select --";
  }, [selected.length, showCountOnly]);

  const menuPortalTarget = useMemo(() => {
    if (typeof document === "undefined") return undefined;
    return document.body;
  }, []);

  const styles: StylesConfig<RsOption, true> = {
    control: (base, state) => ({
      ...base,
      minHeight: "34px",
      borderRadius: "0.375rem",
      borderColor: state.isFocused
        ? "var(--bs-primary)"
        : "var(--bs-border-color)",
      boxShadow: state.isFocused
        ? "0 0 0 .2rem rgba(var(--bs-primary-rgb), .20)"
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
      padding: "0 8px",
      gap: "6px",
    }),

    indicatorsContainer: (base) => ({
      ...base,
      paddingRight: 4,
    }),

    dropdownIndicator: (base) => ({
      ...base,
      padding: 4,
    }),

    clearIndicator: (base) => ({
      ...base,
      padding: 4,
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
      padding: "0 6px",
    }),

    // ✅ X/remove should be red
    multiValueRemove: (base) => ({
      ...base,
      cursor: "pointer",
      color: "var(--bs-danger)",
      ":hover": {
        color: "var(--bs-danger)",
        backgroundColor: "rgba(220, 53, 69, 0.12)",
      },
    }),

    option: (base, state) => ({
      ...base,
      cursor: "pointer",
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
      zIndex: 9999,
      marginTop: 0,
    }),

    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),

    menuList: (base) => ({
      ...base,
      padding: 0,
    }),
  };

  const handleChange = (items: MultiValue<RsOption>) => {
    onChange(items.map((i) => i.value));
  };

  const CheckboxOption = (props: OptionProps<RsOption, true>) => {
    return (
      <components.Option {...props}>
        <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            className="form-check-input"
            checked={props.isSelected}
            readOnly
            style={{ cursor: "pointer" }}
          />
          <span style={{ cursor: "pointer" }}>{props.label}</span>
        </div>
      </components.Option>
    );
  };

  const MenuList = (props: MenuListProps<RsOption, true>) => {
    const actionBtnStyle = (isDisabled: boolean): React.CSSProperties => ({
      cursor: isDisabled ? "not-allowed" : "pointer",
    });

    const isSelectAllDisabled = disabled || rsOptions.length === 0 || isAllSelected;
    const isClearDisabled = disabled || selected.length === 0;

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

          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className="btn btn-outline-primary"
              onMouseDown={(e) => e.preventDefault()}
              onClick={selectAll}
              disabled={isSelectAllDisabled}
              style={actionBtnStyle(isSelectAllDisabled)}
            >
              Select all
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearAll}
              disabled={isClearDisabled}
              style={actionBtnStyle(isClearDisabled)}
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
        placeholder={placeholderText}
        controlShouldRenderValue={!showCountOnly}
        components={{ Option: CheckboxOption, MenuList }}
        classNamePrefix="react-select"
        menuPortalTarget={menuPortalTarget}
        menuPosition="fixed"
        menuShouldScrollIntoView={false}
      />
    </div>
  );
};

export default MultiSelectField;
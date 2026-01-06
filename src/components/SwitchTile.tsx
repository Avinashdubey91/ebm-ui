import React from "react";

type Props = {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchTile: React.FC<Props> = ({ id, name, label, checked, onChange }) => {
  const trigger = () => {
    const el = document.getElementById(id);
    if (el instanceof HTMLInputElement) el.click();
  };

  return (
    <div className="d-flex flex-column w-100">
      <label className="form-label fw-semibold mb-2" htmlFor={id}>
        {label}
      </label>

      <div
        className="border rounded-3 d-flex align-items-center justify-content-between px-3 w-100"
        style={{ minHeight: 38, cursor: "pointer" }}
        onClick={trigger}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            trigger();
          }
        }}
        role="button"
        tabIndex={0}
        aria-controls={id}
      >
        <span className="text-muted">{checked ? "Yes" : "No"}</span>

        <div className="form-check form-switch m-0">
          <input
            id={id}
            className="form-check-input"
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
};

export default SwitchTile;
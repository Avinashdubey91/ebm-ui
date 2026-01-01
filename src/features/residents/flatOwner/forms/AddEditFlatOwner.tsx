// src/features/residents/flatOwner/forms/AddEditFlatOwner.tsx

import React, { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  createEntity,
  fetchEntityById,
  fetchAllEntities,
  updateEntity,
} from "../../../../api/genericCrudApi";
import TextInputField from "../../../../components/common/TextInputField";
import SelectField from "../../../../components/common/SelectField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

import type { FlatOwnerDTO } from "../../../../types/FlatOwnerDTO";
import type { SocietyDTO } from "../../../../types/SocietyDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";
import type { FlatDTO } from "../../../../types/FlatDTO";
import type { OwnerDTO } from "../../../../types/OwnerDTO";
import DateInput from "../../../../components/common/DateInput";

// ---- Endpoints used here ----
const endpoints = {
  societies: "/society/Get-All-Societies",
  apartments: "/apartment/Get-All-Apartment",
  flats: "/flat/Get-All-Flats",
  ownersBasic: "/flatowner/Get-Active-Owners-Basic",

  getById: "/flatowner/Get-Owner-By-Id",
  assign: "/flatowner/Assign-Owner",
  update: "/flatowner/Update-Owner-By-Id",
};

// ---- Local form state (extends your DTO with UI-only fields) ----
type FormState = FlatOwnerDTO & {
  societyId?: number;
  apartmentId?: number;

  // display-only fields
  ownerEmail?: string;
  ownerAddress?: string;
  ownerPIN?: string;
};

const toYmd = (d?: string | Date | null): string | undefined => {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

const ymdToday = () => toYmd(new Date())!;

type SelectOption = { label: string; value: string | number };

function toOptions<T>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => string | number | undefined | null
): SelectOption[] {
  return items
    .map((it) => {
      const v = getValue(it);
      if (v === undefined || v === null || v === "") return null;
      return {
        label: getLabel(it),
        value: typeof v === "number" ? v : String(v),
      };
    })
    .filter((x): x is SelectOption => x !== null);
}

const emptyForm: FormState = {
  flatOwnerId: 0,
  flatId: 0,
  ownerId: 0,
  ownershipFrom: ymdToday(),
  ownershipTo: undefined,
  isPrimaryOwner: true,
  ownershipProof: "",
  notes: "",

  firstName: "",
  lastName: "",
  gender: "",
  mobile: "",
  emailId: "",
  address: "",
  pinCode: "",
  occupation: "",
  flatNumber: "",

  societyId: undefined,
  apartmentId: undefined,
  ownerEmail: "",
  ownerAddress: "",
  ownerPIN: "",
};

interface Props {
  flatOwnerId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
};

const SectionCard = ({ title, children }: SectionCardProps) => (
  <div className="border rounded-3 p-3">
    <div className="fw-bold mb-3">{title}</div>
    {children}
  </div>
);

type SwitchTileProps = {
  id: string;
  name: "isPrimaryOwner";
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchTile = ({
  id,
  name,
  label,
  checked,
  onChange,
}: SwitchTileProps) => {
  // Match Bootstrap control height (Select/Input). If your SelectField is taller, change to 44.
  const controlMinHeight = 38;

  return (
    <div className="d-flex flex-column w-100">
      {/* Label exactly like other fields */}
      <label className="form-label fw-semibold mb-2" htmlFor={id}>
        {label}
      </label>

      {/* Control box like an input/select */}
      <div
        className="border rounded-3 d-flex align-items-center justify-content-between px-3 w-100"
        style={{ minHeight: controlMinHeight }}
      >
        {/* Left side text (optional, keeps it looking like a field) */}
        <span className="text-muted">{checked ? "Yes" : "No"}</span>

        {/* Switch */}
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

const numericFieldNames = new Set([
  "societyId",
  "apartmentId",
  "flatId",
  "ownerId",
]);

const AddEditFlatOwner = forwardRef<AddEditFormHandle, Props>(
  ({ flatOwnerId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();
    const isEdit = !!flatOwnerId;

    const [formData, setFormData] = useState<FormState>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save"
    );
    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FormState | null>(null);

    const [societies, setSocieties] = useState<SocietyDTO[]>([]);
    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [flats, setFlats] = useState<FlatDTO[]>([]);
    const [owners, setOwners] = useState<OwnerDTO[]>([]);

    const readOnlyInputChange: React.ChangeEventHandler<
      HTMLInputElement
    > = () => {
      // Read-only display fields (keeps TextInputField contract)
    };

    async function fetchAll<T>(url: string): Promise<T[]> {
      const res = await fetchAllEntities<T>(url);
      return res ?? [];
    }

    // Load dropdown data
    useEffect(() => {
      (async () => {
        try {
          const [soc, apt, flt, own] = await Promise.all([
            fetchAll<SocietyDTO>(endpoints.societies),
            fetchAll<ApartmentDTO>(endpoints.apartments),
            fetchAll<FlatDTO>(endpoints.flats),
            fetchAll<OwnerDTO>(endpoints.ownersBasic),
          ]);

          setSocieties(soc);
          setApartments(apt);
          setFlats(flt);
          setOwners(own);
        } catch (e) {
          console.error("Failed to load dropdown data", e);
        }
      })();
    }, []);

    // Edit mode load
    useEffect(() => {
      (async () => {
        if (!flatOwnerId) {
          setFormData(emptyForm);
          initialRef.current = { ...emptyForm };
          return;
        }
        try {
          const data = await fetchEntityById<FlatOwnerDTO>(
            endpoints.getById,
            flatOwnerId
          );

          const next: FormState = {
            ...emptyForm,
            ...data,
            ownershipFrom: toYmd(data.ownershipFrom)!,
            ownershipTo: toYmd(data.ownershipTo),
            ownerEmail: data.emailId ?? "",
            ownerAddress: data.address ?? "",
            ownerPIN: data.pinCode ?? "",
          };

          setFormData(next);
          initialRef.current = { ...next };
        } catch (e) {
          console.error("Failed to load flat owner mapping", e);
        }
      })();
    }, [flatOwnerId]);

    // Backfill society/apartment when editing
    useEffect(() => {
      if (!formData.flatId || apartments.length === 0 || flats.length === 0)
        return;

      const flat = flats.find(
        (f) => Number(f.flatId) === Number(formData.flatId)
      );
      if (!flat) return;

      const inferredApartmentId = Number(flat.apartmentId);
      const apartment = apartments.find(
        (a) => Number(a.apartmentId) === inferredApartmentId
      );
      const inferredSocietyId = apartment
        ? Number(apartment.societyId)
        : undefined;

      setFormData((prev) => {
        const needsApt =
          !prev.apartmentId || prev.apartmentId !== inferredApartmentId;
        const needsSoc =
          !prev.societyId || prev.societyId !== inferredSocietyId;

        if (!needsApt && !needsSoc) return prev;

        return {
          ...prev,
          apartmentId: needsApt ? inferredApartmentId : prev.apartmentId,
          societyId: needsSoc ? inferredSocietyId : prev.societyId,
        };
      });
    }, [flats, apartments, formData.flatId]);

    // Unsaved changes
    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      const keys = Object.keys(formData) as (keyof FormState)[];
      const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);
      return keys.some(
        (k) => trim(formData[k]) !== trim(initialRef.current![k])
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const ownerDisplayName = useMemo(() => {
      const full = `${formData.firstName ?? ""} ${
        formData.lastName ?? ""
      }`.trim();
      return full;
    }, [formData.firstName, formData.lastName]);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.currentTarget;

      let finalValue: string | number | boolean | undefined = value;
      const isInput = e.currentTarget instanceof HTMLInputElement;

      if (isInput && e.currentTarget.type === "checkbox") {
        finalValue = e.currentTarget.checked;
      } else if (numericFieldNames.has(name)) {
        finalValue = value === "" ? undefined : Number(value);
      }

      setFormData((prev) => {
        const next: FormState = { ...prev, [name]: finalValue };

        if (name === "societyId") {
          next.apartmentId = undefined;
          next.flatId = 0;
        }

        if (name === "apartmentId") {
          next.flatId = 0;
        }

        if (name === "flatId") {
          const f = flats.find(
            (ff) => Number(ff.flatId) === Number(finalValue)
          );
          next.flatNumber = f?.flatNumber ?? "";

          if (f) {
            if (!next.apartmentId) next.apartmentId = Number(f.apartmentId);

            const a = apartments.find(
              (ap) => Number(ap.apartmentId) === Number(f.apartmentId)
            );
            if (a && !next.societyId) next.societyId = Number(a.societyId);
          }
        }

        if (name === "ownerId") {
          const o = owners.find(
            (oo) => Number(oo.ownerId) === Number(finalValue)
          );
          next.firstName = o?.firstName ?? "";
          next.lastName = o?.lastName ?? "";
          next.mobile = o?.mobile ?? "";
          next.emailId = o?.emailId ?? "";
          next.address = o?.address ?? "";
          next.pinCode = o?.pinCode ?? "";
          next.occupation = o?.occupation ?? "";

          next.ownerEmail = o?.emailId ?? "";
          next.ownerAddress = o?.address ?? "";
          next.ownerPIN = o?.pinCode ?? "";
        }

        return next;
      });
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();

      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      const payload: FlatOwnerDTO = {
        flatOwnerId: formData.flatOwnerId ?? 0,
        flatId: Number(formData.flatId),
        ownerId: Number(formData.ownerId),
        ownershipFrom: toYmd(formData.ownershipFrom)!,
        ownershipTo: toYmd(formData.ownershipTo),
        isPrimaryOwner: !!formData.isPrimaryOwner,
        ownershipProof: formData.ownershipProof ?? "",
        notes: formData.notes ?? "",

        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        mobile: formData.mobile,
        emailId: formData.emailId,
        address: formData.address,
        pinCode: formData.pinCode,
        occupation: formData.occupation,
        flatNumber: formData.flatNumber,
      };

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") || "0", 10);

        if (isEdit && formData.flatOwnerId) {
          await updateEntity(
            endpoints.update,
            formData.flatOwnerId,
            payload,
            userId,
            false
          );
          await showAddUpdateResult(true, "update", "flat owner mapping");
        } else {
          await createEntity(endpoints.assign, payload, userId, false);
          await showAddUpdateResult(true, "add", "flat owner mapping");
        }

        if (submitMode === "saveAndNext" && !isEdit) {
          setFormData((prev) => ({
            ...emptyForm,
            societyId: prev.societyId,
            apartmentId: prev.apartmentId,
            flatId: prev.flatId,
            flatNumber: prev.flatNumber,
          }));
          initialRef.current = { ...emptyForm };
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "flat owner mapping");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleReset = () => {
      const val = initialRef.current ?? emptyForm;
      setFormData({ ...val });
    };

    React.useImperativeHandle(ref, () => ({
      submit: () => {
        setSubmitMode("save");
        formRef.current?.requestSubmit();
      },
      reset: handleReset,
      saveAndNext: () => {
        setSubmitMode("saveAndNext");
        formRef.current?.requestSubmit();
      },
    }));

    const filteredApartments = apartments.filter(
      (a) => Number(a.societyId) === Number(formData.societyId)
    );

    const filteredFlats = flats.filter(
      (f) => Number(f.apartmentId) === Number(formData.apartmentId)
    );

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={() => {
          setSubmitMode("saveAndNext");
          formRef.current?.requestSubmit();
        }}
        isEditMode={!!flatOwnerId}
        formRef={formRef}
      >
        <div className="row g-4">
          <div className="col-12">
            <SectionCard title="Property Selection">
              <div className="row g-3">
                <div className="col-md-4">
                  <SelectField
                    label="Society"
                    name="societyId"
                    value={formData.societyId ?? ""}
                    onChange={handleChange}
                    required
                    disabled={isEdit}
                    options={toOptions(
                      societies,
                      (s) => s.societyName,
                      (s) => s.societyId
                    )}
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Apartment"
                    name="apartmentId"
                    value={formData.apartmentId ?? ""}
                    onChange={handleChange}
                    required
                    disabled={isEdit || !formData.societyId}
                    options={toOptions(
                      filteredApartments,
                      (a) => a.apartmentName ?? `Apartment #${a.apartmentId}`,
                      (a) => a.apartmentId
                    )}
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Flat"
                    name="flatId"
                    value={formData.flatId ? formData.flatId : ""}
                    onChange={handleChange}
                    required
                    disabled={isEdit || !formData.apartmentId}
                    options={toOptions(
                      filteredFlats,
                      (f) => f.flatNumber ?? `Flat #${f.flatId}`,
                      (f) => f.flatId
                    )}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Owner & Ownership">
              <div className="row g-3">
                <div className="col-md-6">
                  <SelectField
                    label="Owner"
                    name="ownerId"
                    value={formData.ownerId ? formData.ownerId : ""}
                    onChange={handleChange}
                    required
                    options={owners.map((o) => ({
                      label: `${o.firstName} ${o.lastName}${
                        o.mobile ? ` (${o.mobile})` : ""
                      }`,
                      value: o.ownerId,
                    }))}
                  />
                </div>

                <div className="col-md-6">
                  <SwitchTile
                    id="flatowner-switch-isPrimaryOwner"
                    name="isPrimaryOwner"
                    label="Primary Owner"
                    checked={!!formData.isPrimaryOwner}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Owner Name"
                    name="ownerNameDisplay"
                    value={ownerDisplayName}
                    onChange={readOnlyInputChange}
                    readOnly
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Owner Mobile"
                    name="ownerMobileDisplay"
                    value={formData.mobile ?? ""}
                    onChange={readOnlyInputChange}
                    readOnly
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Owner Email"
                    name="ownerEmail"
                    value={formData.ownerEmail ?? ""}
                    onChange={readOnlyInputChange}
                    readOnly
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Occupation"
                    name="ownerOccupationDisplay"
                    value={formData.occupation ?? ""}
                    onChange={readOnlyInputChange}
                    readOnly
                  />
                </div>

                <div className="col-md-8">
                  <TextInputField
                    label="Owner Address"
                    name="ownerAddress"
                    value={formData.ownerAddress ?? ""}
                    onChange={readOnlyInputChange}
                    readOnly
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="PIN Code"
                    name="ownerPIN"
                    value={formData.ownerPIN ?? ""}
                    onChange={readOnlyInputChange}
                    readOnly
                  />
                </div>

                <div className="col-md-3">
                  <DateInput
                    id="ownershipFrom"
                    label="Ownership From"
                    value={formData.ownershipFrom ?? ""}
                    onChange={(newDate) =>
                      setFormData((prev) => ({
                        ...prev,
                        ownershipFrom: newDate,
                      }))
                    }
                    required
                  />
                </div>

                <div className="col-md-3">
                  <DateInput
                    id="ownershipTo"
                    label="Ownership To"
                    value={formData.ownershipTo ?? ""}
                    onChange={(newDate) =>
                      setFormData((prev) => ({
                        ...prev,
                        ownershipTo: newDate || undefined,
                      }))
                    }
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Ownership Proof (No.)"
                    name="ownershipProof"
                    value={formData.ownershipProof ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Notes">
              <div className="row g-3">
                <div className="col-12">
                  <TextInputField
                    label="Notes"
                    name="notes"
                    value={formData.notes ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditFlatOwner;

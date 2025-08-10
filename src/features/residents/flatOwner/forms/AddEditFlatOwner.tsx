// src/features/residents/flatOwner/forms/AddEditFlatOwner.tsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createEntity,
  fetchEntityById,
  fetchAllEntities,
  updateEntity, // ✅ added
} from "../../../../api/genericCrudApi";
import TextInputField from "../../../../components/common/TextInputField";
import SelectField from "../../../../components/common/SelectField";
import CheckBoxField from "../../../../components/common/CheckBoxField";
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
  // data sources
  societies: "/society/Get-All-Societies",
  apartments: "/apartment/Get-All-Apartment",
  flats: "/flat/Get-All-Flats",
  ownersBasic: "/flatowner/Get-Active-Owners-Basic",

  // mapping
  getById: "/flatowner/Get-Owner-By-Id",   // /{flatOwnerId}
  assign: "/flatowner/Assign-Owner",
  update: "/flatowner/Update-Owner-By-Id", // ✅ genericCrudApi will append /{id}
};

// ---- Local DTO for the form (extends your FlatOwnerDTO with local fields) ----
type FormState = FlatOwnerDTO & {
  // UI-only fields for cascading
  societyId?: number;
  apartmentId?: number;

  // auto-filled owner fields for display (read-only)
  ownerEmail?: string;
  ownerAddress?: string;
  ownerPIN?: string;
};

const toYmd = (d?: string | Date | null): string | undefined => {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10); // "yyyy-MM-dd"
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
      return { label: getLabel(it), value: typeof v === "number" ? v : String(v) };
    })
    .filter((x): x is SelectOption => x !== null);
}

const emptyForm: FormState = {
  flatOwnerId: 0,
  flatId: 0,
  ownerId: 0,
  ownershipFrom: ymdToday(),     // ✅ "yyyy-MM-dd" string
  ownershipTo: undefined,        // ✅ string | undefined
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

const AddEditFlatOwner = forwardRef<AddEditFormHandle, Props>(
  ({ flatOwnerId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();
    const isEdit = !!flatOwnerId;

    const [formData, setFormData] = useState<FormState>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">("save");
    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FormState | null>(null);

    // data caches
    const [societies, setSocieties] = useState<SocietyDTO[]>([]);
    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [flats, setFlats] = useState<FlatDTO[]>([]);
    const [owners, setOwners] = useState<OwnerDTO[]>([]);

    // ---------- Load master data ----------
    useEffect(() => {
      (async () => {
        try {
          // Load all societies, apartments, flats (client-side filter)
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

    // ---------- Edit mode (load existing mapping) ----------
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
            // ensure date inputs are yyyy-mm-dd strings
            ownershipFrom: toYmd(data.ownershipFrom)!,           // ✅ normalized
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

    // When editing: once lists are loaded and we know flatId,
    // backfill apartmentId and societyId so selects show the current values.
    useEffect(() => {
      if (!formData.flatId || apartments.length === 0 || flats.length === 0) return;

      const flat = flats.find(f => f.flatId === formData.flatId);
      if (!flat) return;

      const inferredApartmentId = Number(flat.apartmentId);
      const apartment = apartments.find(a => a.apartmentId === inferredApartmentId);
      const inferredSocietyId = apartment ? Number(apartment.societyId) : undefined;

      setFormData(prev => {
        const needsApt = !prev.apartmentId || prev.apartmentId !== inferredApartmentId;
        const needsSoc = !prev.societyId || prev.societyId !== inferredSocietyId;

        if (!needsApt && !needsSoc) return prev;

        return {
          ...prev,
          apartmentId: needsApt ? inferredApartmentId : prev.apartmentId,
          societyId: needsSoc ? inferredSocietyId : prev.societyId,
        };
      });
    }, [flats, apartments, formData.flatId]);

    // ---------- Track unsaved changes ----------
    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      const keys = Object.keys(formData) as (keyof FormState)[];
      const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);
      return keys.some(k => trim(formData[k]) !== trim(initialRef.current![k]));
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    async function fetchAll<T>(url: string): Promise<T[]> {
      const res = await fetchAllEntities<T>(url);
      return res ?? [];
    }

    // ---------- Handlers ----------
    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;

      const numericFields = new Set(["societyId", "apartmentId", "flatId", "ownerId"]);

      const finalValue =
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : numericFields.has(name)
          ? value === "" ? undefined : Number(value)
          : value;

      setFormData(prev => {
        const next = { ...prev, [name]: finalValue };

        // cascading resets
        if (name === "societyId") {
          next.apartmentId = undefined;
          next.flatId = 0;
        }
        if (name === "apartmentId") {
          next.flatId = 0;
        }

        // when flat changes, fill flatNumber and infer parents if needed
        if (name === "flatId") {
          const f = flats.find(ff => ff.flatId === Number(finalValue));
          next.flatNumber = f?.flatNumber ?? "";
          if (f) {
            if (!next.apartmentId) next.apartmentId = Number(f.apartmentId);
            const a = apartments.find(ap => ap.apartmentId === f.apartmentId);
            if (a && !next.societyId) next.societyId = Number(a.societyId);
          }
        }

        // when owner changes, fill display-only fields
        if (name === "ownerId") {
          const o = owners.find(oo => oo.ownerId === Number(finalValue));
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

      // Minimal payload needed for assign/update:
      const payload: FlatOwnerDTO = {
        flatOwnerId: formData.flatOwnerId ?? 0,
        flatId: Number(formData.flatId),
        ownerId: Number(formData.ownerId),

        // strings, not Date objects
        ownershipFrom: toYmd(formData.ownershipFrom)!,  // required
        ownershipTo: toYmd(formData.ownershipTo),

        isPrimaryOwner: !!formData.isPrimaryOwner,
        ownershipProof: formData.ownershipProof ?? "",
        notes: formData.notes ?? "",

        // backend typically ignores these on create/update; harmless to send
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
          // ✅ Update existing mapping
          await updateEntity(endpoints.update, formData.flatOwnerId, payload, userId, false);
          await showAddUpdateResult(true, "update", "flat owner mapping");
        } else {
          // ✅ Assign new mapping
          await createEntity(endpoints.assign, payload, userId, false);
          await showAddUpdateResult(true, "add", "flat owner mapping");
        }

        if (submitMode === "saveAndNext" && !isEdit) {
          // Clear just the mapping fields; keep dropdown context if you prefer
          setFormData(prev => ({
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
        await showAddUpdateResult(false, "error", "flat owner mapping"); // ✅ success=false
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleReset = () => {
      const val = initialRef.current ?? emptyForm;
      setFormData({ ...val });
    };

    // expose imperative handlers (matches SharedAddEditForm usage)
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

    // ---------- UI ----------
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
        <div className="row align-items-end">
          {/* Society */}
          <div className="col-md-4 mb-3">
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

          {/* Apartment (filtered by Society) */}
          <div className="col-md-4 mb-3">
            <SelectField
              label="Apartment"
              name="apartmentId"
              value={formData.apartmentId ?? ""}
              onChange={handleChange}
              required
              disabled={isEdit || !formData.societyId}
              options={toOptions(
                apartments.filter((a) => a.societyId === formData.societyId),
                (a) => a.apartmentName ?? `Apartment #${a.apartmentId}`,
                (a) => a.apartmentId
              )}
            />
          </div>

          {/* Flat */}
          <div className="col-md-4 mb-3">
            <SelectField
              label="Flat"
              name="flatId"
              value={formData.flatId ?? ""}
              onChange={handleChange}
              required
              disabled={isEdit || !formData.apartmentId}
              options={toOptions(
                flats.filter((f) => f.apartmentId === formData.apartmentId),
                (f) => f.flatNumber ?? `Flat #${f.flatId}`,
                (f) => f.flatId
              )}
            />
          </div>

          {/* Owner */}
          <div className="col-md-4 mb-3">
            <SelectField
              label="Owner"
              name="ownerId"
              value={formData.ownerId || ""}
              onChange={handleChange}
              required
              options={owners.map((o) => ({
                label: `${o.firstName} ${o.lastName}${o.mobile ? ` (${o.mobile})` : ""}`,
                value: o.ownerId,
              }))}
            />
          </div>

          {/* Auto-filled owner details (read-only) */}
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Owner Email"
              name="ownerEmail"
              value={formData.ownerEmail ?? ""}
              onChange={() => {}}
              readOnly
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Owner Address"
              name="ownerAddress"
              value={formData.ownerAddress ?? ""}
              onChange={() => {}}
              readOnly
            />
          </div>
          <div className="col-md-3 mb-3">
            <TextInputField
              label="PIN Code"
              name="ownerPIN"
              value={formData.ownerPIN ?? ""}
              onChange={() => {}}
              readOnly
            />
          </div>

          {/* Dates */}
          <div className="col-md-3 mb-3">
            <DateInput
              id="ownershipFrom"
              label="Ownership From"
              value={formData.ownershipFrom ?? ""} // "YYYY-MM-DD"
              onChange={(newDate) =>
                setFormData((prev) => ({ ...prev, ownershipFrom: newDate }))
              }
              required
            />
          </div>
          <div className="col-md-3 mb-3">
            <DateInput
              id="ownershipTo"
              label="Ownership To"
              value={formData.ownershipTo ?? ""} // "YYYY-MM-DD" or ""
              onChange={(newDate) =>
                setFormData((prev) => ({ ...prev, ownershipTo: newDate || undefined }))
              }
              // min={formData.ownershipFrom ?? ""} // uncomment if your DateInput forwards this prop
            />
          </div>

          <div className="col-md-3 mb-3">
            <TextInputField
              label="Ownership Proof (No.)"
              name="ownershipProof"
              value={formData.ownershipProof ?? ""}
              onChange={handleChange}
            />
          </div>

          {/* Primary + notes */}
          <div className="col-md-3 mb-4 d-flex align-items-center">
            <CheckBoxField
              label="Primary Owner"
              name="isPrimaryOwner"
              checked={!!formData.isPrimaryOwner}
              onChange={handleChange}
              checkboxStyle={{ transform: "scale(1.1)", marginRight: "10px" }}
            />
          </div>

          <div className="col-md-9 mb-3">
            <TextInputField
              label="Notes"
              name="notes"
              value={formData.notes ?? ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditFlatOwner;

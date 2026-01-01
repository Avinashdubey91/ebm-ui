import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
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
import DateInput from "../../../../components/common/DateInput";

import type { FlatRenterDTO } from "../../../../types/FlatRenterDTO";
import type { SocietyDTO } from "../../../../types/SocietyDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";
import type { FlatDTO } from "../../../../types/FlatDTO";
import type { RenterDTO } from "../../../../types/RenterDTO";

// ---- Endpoints used here ----
const endpoints = {
  societies: "/society/Get-All-Societies",
  apartments: "/apartment/Get-All-Apartment",
  flats: "/flat/Get-All-Flats",
  rentersBasic: "/flatrenter/Get-Active-Renters-Basic",

  getById: "/flatrenter/Get-Renter-By-Id", // /{flatRenterId}
  assign: "/flatrenter/Assign-Renter",
  update: "/flatrenter/Update-Renter-By-Id", // genericCrudApi appends /{id}
};

type SelectOption = { label: string; value: string | number };

const toOptions = <T,>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => string | number | undefined | null
): SelectOption[] =>
  items
    .map((it) => {
      const v = getValue(it);
      if (v === undefined || v === null || v === "") return null;
      return { label: getLabel(it), value: typeof v === "number" ? v : String(v) };
    })
    .filter((x): x is SelectOption => x !== null);

const toYmd = (d?: string | Date | null): string | undefined => {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};
const ymdToday = () => toYmd(new Date())!;

// ---- Local DTO shape for the form (extends FlatRenterDTO with UI-only fields) ----
type FormState = FlatRenterDTO & {
  societyId?: number;
  apartmentId?: number;

  renterEmail?: string;
  renterAddress?: string;
  renterPIN?: string;
};

const emptyForm: FormState = {
  flatRenterId: 0,
  flatId: 0,
  renterId: 0,
  rentFrom: ymdToday(),
  rentTo: undefined,
  agreementNumber: "",
  notes: "",

  firstName: "",
  lastName: "",
  gender: "",
  mobile: "",
  emailId: "",
  address: "",

  flatNumber: "",

  societyId: undefined,
  apartmentId: undefined,
  renterEmail: "",
  renterAddress: "",
  renterPIN: "",
};

interface Props {
  flatRenterId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0">{title}</h5>
        </div>
        {children}
      </div>
    </div>
  );
}

const AddEditFlatRenter = forwardRef<AddEditFormHandle, Props>(
  ({ flatRenterId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();
    const isEdit = !!flatRenterId;

    const [formData, setFormData] = useState<FormState>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">("save");
    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FormState | null>(null);

    const [societies, setSocieties] = useState<SocietyDTO[]>([]);
    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [flats, setFlats] = useState<FlatDTO[]>([]);
    const [renters, setRenters] = useState<RenterDTO[]>([]);

    // ---------- Load dropdown data ----------
    useEffect(() => {
      (async () => {
        try {
          const [soc, apt, flt, ren] = await Promise.all([
            fetchAllEntities<SocietyDTO>(endpoints.societies),
            fetchAllEntities<ApartmentDTO>(endpoints.apartments),
            fetchAllEntities<FlatDTO>(endpoints.flats),
            fetchAllEntities<RenterDTO>(endpoints.rentersBasic),
          ]);

          setSocieties(soc ?? []);
          setApartments(apt ?? []);
          setFlats(flt ?? []);
          setRenters(ren ?? []);
        } catch (e) {
          console.error("Failed to load dropdown data", e);
        }
      })();
    }, []);

    // ---------- Edit mode: load existing mapping ----------
    useEffect(() => {
      (async () => {
        if (!flatRenterId) {
          setFormData(emptyForm);
          initialRef.current = { ...emptyForm };
          return;
        }

        try {
          const data = await fetchEntityById<FlatRenterDTO>(
            endpoints.getById,
            flatRenterId
          );

          const next: FormState = {
            ...emptyForm,
            ...data,
            rentFrom: toYmd(data.rentFrom)!,
            rentTo: toYmd(data.rentTo),
            renterEmail: data.emailId ?? "",
            renterAddress: data.address ?? "",
            renterPIN: (data as unknown as { pinCode?: string }).pinCode ?? "",
          };

          setFormData(next);
          initialRef.current = { ...next };
        } catch (e) {
          console.error("Failed to load flat renter mapping", e);
        }
      })();
    }, [flatRenterId]);

    // Infer apartmentId and societyId from flatId after masters load (edit mode)
    useEffect(() => {
      if (!formData.flatId || apartments.length === 0 || flats.length === 0) return;

      const flat = flats.find((f) => f.flatId === formData.flatId);
      if (!flat) return;

      const inferredApartmentId = Number(flat.apartmentId);
      const apartment = apartments.find((a) => a.apartmentId === inferredApartmentId);
      const inferredSocietyId = apartment ? Number(apartment.societyId) : undefined;

      setFormData((prev) => {
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

    // ---------- Unsaved changes ----------
    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      const keys = Object.keys(formData) as (keyof FormState)[];
      const trim = (v: unknown) => (typeof v === "string" ? v.trim() : v);
      return keys.some((k) => trim(formData[k]) !== trim(initialRef.current![k]));
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    // ---------- Derived lists ----------
    const filteredApartments = useMemo(
      () => apartments.filter((a) => Number(a.societyId) === Number(formData.societyId)),
      [apartments, formData.societyId]
    );

    const filteredFlats = useMemo(
      () => flats.filter((f) => Number(f.apartmentId) === Number(formData.apartmentId)),
      [flats, formData.apartmentId]
    );

    const renterOptions = useMemo(
      () =>
        renters.map((r) => ({
          label: `${r.firstName} ${r.lastName}${r.mobile ? ` (${r.mobile})` : ""}`,
          value: r.renterId,
        })),
      [renters]
    );

    // ---------- Handlers ----------
    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const target = e.currentTarget;
      const { name } = target;

      const numericFields = new Set(["societyId", "apartmentId", "flatId", "renterId"]);

      const isCheckbox =
        target instanceof HTMLInputElement && target.type === "checkbox";

      const finalValue: string | number | boolean | undefined =
        isCheckbox
          ? target.checked
          : numericFields.has(name)
          ? target.value === ""
            ? undefined
            : Number(target.value)
          : target.value;

      setFormData((prev) => {
        const next: FormState = { ...prev, [name]: finalValue };

        if (name === "societyId") {
          next.apartmentId = undefined;
          next.flatId = 0;
          next.flatNumber = "";
        }

        if (name === "apartmentId") {
          next.flatId = 0;
          next.flatNumber = "";
        }

        if (name === "flatId") {
          const f = flats.find((ff) => ff.flatId === Number(finalValue));
          next.flatNumber = f?.flatNumber ?? "";
          if (f) {
            if (!next.apartmentId) next.apartmentId = Number(f.apartmentId);
            const a = apartments.find((ap) => ap.apartmentId === f.apartmentId);
            if (a && !next.societyId) next.societyId = Number(a.societyId);
          }
        }

        if (name === "renterId") {
          const r = renters.find((rr) => rr.renterId === Number(finalValue));
          next.firstName = r?.firstName ?? "";
          next.lastName = r?.lastName ?? "";
          next.mobile = r?.mobile ?? "";
          next.emailId = r?.emailId ?? "";
          next.address = r?.address ?? "";

          next.renterEmail = r?.emailId ?? "";
          next.renterAddress = r?.address ?? "";
          next.renterPIN = r?.pinCode ?? "";
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

      const payload: FlatRenterDTO = {
        flatRenterId: formData.flatRenterId ?? 0,
        flatId: Number(formData.flatId),
        renterId: Number(formData.renterId),
        rentFrom: toYmd(formData.rentFrom)!,
        rentTo: toYmd(formData.rentTo),
        agreementNumber: formData.agreementNumber ?? "",
        notes: formData.notes ?? "",

        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        mobile: formData.mobile,
        emailId: formData.emailId,
        address: formData.address,
        flatNumber: formData.flatNumber,
      };

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") || "0", 10);

        if (isEdit && formData.flatRenterId) {
          await updateEntity(endpoints.update, formData.flatRenterId, payload, userId, false);
          await showAddUpdateResult(true, "update", "flat renter mapping");
        } else {
          await createEntity(endpoints.assign, payload, userId, false);
          await showAddUpdateResult(true, "add", "flat renter mapping");
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
        await showAddUpdateResult(false, "error", "flat renter mapping");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleReset = () => {
      const val = initialRef.current ?? emptyForm;
      setFormData({ ...val });
    };

    useImperativeHandle(ref, () => ({
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

    const noopReadOnlyChange: React.ChangeEventHandler<HTMLInputElement> = () => undefined;

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
        isEditMode={!!flatRenterId}
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
                    options={toOptions(societies, (s) => s.societyName, (s) => s.societyId)}
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
            <SectionCard title="Renter">
              <div className="row g-3">
                <div className="col-md-6">
                  <SelectField
                    label="Renter"
                    name="renterId"
                    value={formData.renterId ? formData.renterId : ""}
                    onChange={handleChange}
                    required
                    options={renterOptions}
                  />
                </div>

                <div className="col-md-3">
                  <TextInputField
                    label="Renter Mobile"
                    name="mobile"
                    value={formData.mobile ?? ""}
                    onChange={noopReadOnlyChange}
                    readOnly
                  />
                </div>

                <div className="col-md-3">
                  <TextInputField
                    label="Renter Email"
                    name="renterEmail"
                    value={formData.renterEmail ?? ""}
                    onChange={noopReadOnlyChange}
                    readOnly
                  />
                </div>

                <div className="col-md-9">
                  <TextInputField
                    label="Renter Address"
                    name="renterAddress"
                    value={formData.renterAddress ?? ""}
                    onChange={noopReadOnlyChange}
                    readOnly
                  />
                </div>

                <div className="col-md-3">
                  <TextInputField
                    label="PIN Code"
                    name="renterPIN"
                    value={formData.renterPIN ?? ""}
                    onChange={noopReadOnlyChange}
                    readOnly
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Rental Details">
              <div className="row g-3">
                <div className="col-md-3">
                  <DateInput
                    id="rentFrom"
                    label="Rent From"
                    value={formData.rentFrom ?? ""}
                    onChange={(newDate) =>
                      setFormData((prev) => ({ ...prev, rentFrom: newDate }))
                    }
                    required
                  />
                </div>

                <div className="col-md-3">
                  <DateInput
                    id="rentTo"
                    label="Rent To"
                    value={formData.rentTo ?? ""}
                    onChange={(newDate) =>
                      setFormData((prev) => ({ ...prev, rentTo: newDate || undefined }))
                    }
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Agreement Number"
                    name="agreementNumber"
                    value={formData.agreementNumber ?? ""}
                    onChange={handleChange}
                  />
                </div>

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

export default AddEditFlatRenter;
// src/features/maintenance/flatMaintenance/forms/AddEditFlatMaintenance.tsx
import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MultiSelectField from "../../../../components/common/MultiSelectField";

import {
  createEntity,
  fetchAllEntities,
  fetchEntityById,
  updateEntity,
} from "../../../../api/genericCrudApi";

import SelectField from "../../../../components/common/SelectField";
import DateInput from "../../../../components/common/DateInput";
import SharedAddEditForm, {
  type AddEditFormHandle,
} from "../../../shared/SharedAddEditForm";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

import { normalizeToYmd } from "../../../../utils/format";

import type { FlatMaintenanceDTO } from "../../../../types/FlatMaintenanceDTO";
import type { MaintenanceGroupDTO } from "../../../../types/MaintenanceGroupDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

type FlatLite = {
  flatId: number;
  apartmentId?: number | null;
  flatNumber?: string | null;
  isActive?: boolean | null;
};

type SelectOption = { label: string; value: string };

type FormState = {
  apartmentId?: number;
  maintenanceGroupId?: number;
  flatIds: number[];
  effectiveFrom: string; // yyyy-MM-dd
  effectiveTo?: string; // yyyy-MM-dd
};

type Props = {
  flatMaintenanceId?: number;
};

const endpoints = {
  getById: "/flatmaintenance/Get-FlatMaintenance-By-Id",
  add: "/flatmaintenance/Add-New-FlatMaintenance",
  update: "/flatmaintenance/Update-FlatMaintenance-By-Id",
  apartments: "/apartment/Get-All-Apartment",
  groups: "/maintenancegroup/Get-All-MaintenanceGroups",
  flats: "/flat/Get-All-Flats",
};

type SectionCardProps = { title: string; children: React.ReactNode };
const SectionCard = ({ title, children }: SectionCardProps) => (
  <div className="border rounded-3 p-3">
    <div className="fw-bold mb-3">{title}</div>
    {children}
  </div>
);

const toSelectValue = (id?: number): string =>
  typeof id === "number" ? String(id) : "";

const AddEditFlatMaintenance = forwardRef<AddEditFormHandle, Props>(
  ({ flatMaintenanceId }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const isEdit =
      typeof flatMaintenanceId === "number" && flatMaintenanceId > 0;

    const formRef = useRef<HTMLFormElement | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save"
    );

    const emptyForm: FormState = useMemo(
      () => ({
        apartmentId: undefined,
        maintenanceGroupId: undefined,
        flatIds: [],
        effectiveFrom: normalizeToYmd(new Date()),
        effectiveTo: undefined,
      }),
      []
    );

    const initialRef = useRef<FormState | null>(null);
    const [formData, setFormData] = useState<FormState>(emptyForm);

    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [groups, setGroups] = useState<MaintenanceGroupDTO[]>([]);
    const [flats, setFlats] = useState<FlatLite[]>([]);

    useEffect(() => {
      const loadMasters = async () => {
        const [apartmentsRes, groupsRes, flatsRes] = await Promise.all([
          fetchAllEntities<ApartmentDTO>(endpoints.apartments),
          fetchAllEntities<MaintenanceGroupDTO>(endpoints.groups),
          fetchAllEntities<FlatLite>(endpoints.flats),
        ]);

        setApartments(apartmentsRes ?? []);
        setGroups(groupsRes ?? []);
        setFlats(flatsRes ?? []);
      };

      void loadMasters();
    }, []);

    useEffect(() => {
      const loadEdit = async () => {
        if (!isEdit || !flatMaintenanceId) return;

        setIsSubmitting(true);
        try {
          const dto = await fetchEntityById<FlatMaintenanceDTO>(
            endpoints.getById,
            flatMaintenanceId
          );

          const next: FormState = {
            apartmentId: undefined, // will be derived from selected group once masters load
            maintenanceGroupId: dto.maintenanceGroupId,
            flatIds: [dto.flatId],
            effectiveFrom: normalizeToYmd(dto.effectiveFrom),
            effectiveTo: dto.effectiveTo
              ? normalizeToYmd(dto.effectiveTo)
              : undefined,
          };

          initialRef.current = { ...next };
          setFormData(next);
          setHasUnsavedChanges(false);
        } finally {
          setIsSubmitting(false);
        }
      };

      void loadEdit();
    }, [flatMaintenanceId, isEdit]);

    const apartmentNameById = useMemo(() => {
      const m = new Map<number, string>();
      apartments.forEach((a) => {
        if (typeof a.apartmentId !== "number") return;
        m.set(a.apartmentId, a.apartmentName ?? `Apartment #${a.apartmentId}`);
      });
      return m;
    }, [apartments]);

    const flatMetaById = useMemo(() => {
      const m = new Map<
        number,
        { label: string; apartmentId?: number | null }
      >();
      flats.forEach((f) => {
        if (typeof f.flatId !== "number") return;
        const flatNo = f.flatNumber ?? `Flat #${f.flatId}`;
        const inactiveTag = f.isActive === false ? " (Inactive)" : "";
        m.set(f.flatId, {
          label: `${flatNo}${inactiveTag}`,
          apartmentId: f.apartmentId ?? null,
        });
      });
      return m;
    }, [flats]);

    const selectedGroup = useMemo(() => {
      if (typeof formData.maintenanceGroupId !== "number") return null;
      return (
        groups.find(
          (g) => g.maintenanceGroupId === formData.maintenanceGroupId
        ) ?? null
      );
    }, [formData.maintenanceGroupId, groups]);

    useEffect(() => {
      const groupApartmentId = selectedGroup?.apartmentId;
      if (typeof groupApartmentId !== "number") return;

      setFormData((prev) => {
        if (prev.apartmentId === groupApartmentId) return prev;
        if (typeof prev.apartmentId === "number") return prev; // respect explicit selection
        return { ...prev, apartmentId: groupApartmentId };
      });
    }, [selectedGroup]);

    const selectedGroupEffectiveFromYmd = useMemo(() => {
      if (!formData.maintenanceGroupId) return "";

      const g = groups.find(
        (x) => x.maintenanceGroupId === formData.maintenanceGroupId
      );
      return normalizeToYmd(g?.effectiveFrom ?? "");
    }, [formData.maintenanceGroupId, groups]);

    // Apartments that actually have Maintenance Groups
    const apartmentOptions = useMemo((): SelectOption[] => {
      const seen = new Set<number>();
      const aptIds: number[] = [];
      groups.forEach((g) => {
        if (typeof g.apartmentId !== "number") return;
        if (seen.has(g.apartmentId)) return;
        seen.add(g.apartmentId);
        aptIds.push(g.apartmentId);
      });

      return aptIds.map((id) => ({
        value: String(id),
        label: apartmentNameById.get(id) ?? `Apartment #${id}`,
      }));
    }, [apartmentNameById, groups]);

    const effectiveApartmentId = useMemo(() => {
      if (typeof formData.apartmentId === "number") return formData.apartmentId;
      const gid = selectedGroup?.apartmentId;
      return typeof gid === "number" ? gid : null;
    }, [formData.apartmentId, selectedGroup]);

    const groupOptions = useMemo((): SelectOption[] => {
      const filtered =
        typeof effectiveApartmentId === "number"
          ? groups.filter((g) => g.apartmentId === effectiveApartmentId)
          : groups;

      return filtered
        .filter(
          (g) =>
            typeof g.maintenanceGroupId === "number" &&
            typeof g.apartmentId === "number"
        )
        .map((g) => {
          const aptName =
            apartmentNameById.get(g.apartmentId) ??
            `Apartment #${g.apartmentId}`;
          const activeTag = g.isActive ? "" : " (Inactive)";
          return {
            label: `${aptName} | Group ${g.maintenanceGroupId}${activeTag}`,
            value: String(g.maintenanceGroupId),
          };
        });
    }, [apartmentNameById, effectiveApartmentId, groups]);

    const flatOptions = useMemo((): SelectOption[] => {
      const filtered =
        typeof effectiveApartmentId === "number"
          ? flats.filter((f) => f.apartmentId === effectiveApartmentId)
          : [];

      return filtered
        .filter((f) => typeof f.flatId === "number")
        .map((f) => ({
          label: flatMetaById.get(f.flatId)?.label ?? `Flat #${f.flatId}`,
          value: String(f.flatId),
        }));
    }, [effectiveApartmentId, flatMetaById, flats]);

    const validateDates = (): boolean => {
      const from = normalizeToYmd(formData.effectiveFrom ?? null);
      const to = normalizeToYmd(formData.effectiveTo ?? null);

      if (!from) {
        window.alert("Effective From is required.");
        return false;
      }
      if (to && to < from) {
        window.alert(
          "Effective To must be greater than or equal to Effective From."
        );
        return false;
      }
      return true;
    };

    const handleChange: React.ChangeEventHandler<
      HTMLInputElement | HTMLSelectElement
    > = (e) => {
      const { name, value } = e.currentTarget;

      setFormData((prev) => {
        const next: FormState = { ...prev };

        if (name === "apartmentId") {
          next.apartmentId = value ? Number(value) : undefined;
          next.maintenanceGroupId = undefined;
          next.flatIds = [];
        }

        if (name === "maintenanceGroupId") {
          next.maintenanceGroupId = value ? Number(value) : undefined;
          next.flatIds = [];
        }

        return next;
      });

      setHasUnsavedChanges(true);
    };

    const handleReset = () => {
      const val = initialRef.current ?? emptyForm;
      setFormData({ ...val });
      setHasUnsavedChanges(false);
    };

    const handleSaveAndNext = () => {
      setSubmitMode("saveAndNext");
      formRef.current?.requestSubmit();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      if (!validateDates()) return;

      if (typeof effectiveApartmentId !== "number") {
        window.alert("Apartment is required.");
        return;
      }

      if (typeof formData.maintenanceGroupId !== "number") {
        window.alert("Maintenance Group is required.");
        return;
      }

      if (!formData.flatIds.length) {
        window.alert("At least one Flat is required.");
        return;
      }

      const userId = parseInt(localStorage.getItem("userId") ?? "0", 10);
      if (!userId) return;

      const basePayload = {
        maintenanceGroupId: formData.maintenanceGroupId,
        effectiveFrom:
          normalizeToYmd(formData.effectiveFrom) || normalizeToYmd(new Date()),
        effectiveTo: formData.effectiveTo
          ? normalizeToYmd(formData.effectiveTo)
          : null,
      };

      setIsSubmitting(true);
      try {
        if (isEdit && flatMaintenanceId) {
          const flatId = formData.flatIds[0];
          if (typeof flatId !== "number") {
            window.alert("Flat is required.");
            return;
          }

          const payload: Omit<FlatMaintenanceDTO, "flatMaintenanceId"> = {
            flatId,
            ...basePayload,
          };

          await updateEntity(
            endpoints.update,
            flatMaintenanceId,
            payload,
            userId,
            false
          );
          await showAddUpdateResult(true, "update", "flat maintenance mapping");
        } else {
          for (const flatId of formData.flatIds) {
            const payload: Omit<FlatMaintenanceDTO, "flatMaintenanceId"> = {
              flatId,
              ...basePayload,
            };
            // sequential to keep failures clear and avoid server bursts
            await createEntity(endpoints.add, payload, userId, false);
          }
          await showAddUpdateResult(true, "add", "flat maintenance mapping");
        }

        setHasUnsavedChanges(false);

        if (!isEdit && submitMode === "saveAndNext") {
          setFormData((prev) => ({
            ...prev,
            flatIds: [],
            effectiveFrom: normalizeToYmd(new Date()),
            effectiveTo: undefined,
          }));
          setHasUnsavedChanges(false);
          return;
        }

        if (parentListPath) navigate(parentListPath);
      } finally {
        setIsSubmitting(false);
        setSubmitMode("save");
      }
    };

    React.useImperativeHandle(ref, () => ({
      submit: () => {
        setSubmitMode("save");
        formRef.current?.requestSubmit();
      },
      reset: handleReset,
      saveAndNext: handleSaveAndNext,
    }));

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={handleSaveAndNext}
        formRef={formRef}
        isEditMode={isEdit}
      >
        <SectionCard title="Mapping Details">
          <div className="row g-3">
            <div className="col-md-6">
              <SelectField
                label="Apartment"
                name="apartmentId"
                value={toSelectValue(
                  formData.apartmentId ??
                    (typeof effectiveApartmentId === "number"
                      ? effectiveApartmentId
                      : undefined)
                )}
                onChange={handleChange}
                required
                disabled={isEdit}
                options={apartmentOptions}
              />
            </div>

            <div className="col-md-6">
              <DateInput
                id="groupEffectiveFrom"
                label="Group Effective From"
                value={selectedGroupEffectiveFromYmd}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <SelectField
                label="Maintenance Group"
                name="maintenanceGroupId"
                value={toSelectValue(formData.maintenanceGroupId)}
                onChange={handleChange}
                required
                disabled={isEdit}
                options={groupOptions}
              />
            </div>

            <div className="col-md-6">
              {isEdit ? (
                <SelectField
                  label="Flat"
                  name="flatId"
                  value={toSelectValue(formData.flatIds[0])}
                  onChange={() => undefined}
                  required
                  disabled
                  options={flatOptions}
                />
              ) : (
                <div className="d-flex flex-column w-100">
                  <MultiSelectField
                    label="Flat"
                    name="flatIds"
                    value={formData.flatIds.map(String)}
                    options={flatOptions}
                    required
                    disabled={typeof effectiveApartmentId !== "number"}
                    onChange={(values: string[]) => {
                      const ids = values
                        .map((v) => Number(v))
                        .filter((n) => Number.isFinite(n));

                      setFormData((prev) => ({ ...prev, flatIds: ids }));
                      setHasUnsavedChanges(true);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="col-md-3">
              <DateInput
                id="effectiveFrom"
                label="Effective From"
                value={formData.effectiveFrom}
                onChange={(newDate) => {
                  setFormData((prev) => ({
                    ...prev,
                    effectiveFrom: normalizeToYmd(newDate),
                  }));
                  setHasUnsavedChanges(true);
                }}
                required
              />
            </div>

            <div className="col-md-3">
              <DateInput
                id="effectiveTo"
                label="Effective To"
                value={formData.effectiveTo ?? ""}
                onChange={(newDate) => {
                  const normalized = normalizeToYmd(newDate);
                  setFormData((prev) => ({
                    ...prev,
                    effectiveTo: normalized || undefined,
                  }));
                  setHasUnsavedChanges(true);
                }}
                required
              />
            </div>
          </div>
        </SectionCard>
      </SharedAddEditForm>
    );
  }
);

AddEditFlatMaintenance.displayName = "AddEditFlatMaintenance";
export default AddEditFlatMaintenance;

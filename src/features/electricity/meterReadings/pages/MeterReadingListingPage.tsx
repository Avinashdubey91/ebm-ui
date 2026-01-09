import React, { useEffect, useMemo, useState } from "react";

import SharedListingPage from "../../../shared/SharedListingPage";
import MeterReadingListing from "../forms/MeterReadingListing";
import MeterReadingEntryModal from "../forms/MeterReadingEntryModal";

const useHasWindowVerticalScrollbar = (): boolean => {
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const update = () => {
      const docEl = document.documentElement;
      setHasScrollbar(window.innerWidth > docEl.clientWidth);
    };

    update();

    window.addEventListener("resize", update);

    const ro = new ResizeObserver(() => {
      update();
    });

    ro.observe(document.body);

    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  return hasScrollbar;
};

const MeterReadingListingPage: React.FC = () => {
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [listingKey, setListingKey] = useState(0);

  const hasWindowScrollbar = useHasWindowVerticalScrollbar();

  useEffect(() => {
    const onRefresh = () => setListingKey((k) => k + 1);
    window.addEventListener("meterReadingEntry:refresh", onRefresh);
    return () => window.removeEventListener("meterReadingEntry:refresh", onRefresh);
  }, []);

  const contentClassName = hasWindowScrollbar ? "me-3" : "";

  // Apply "me-3" ONLY when scrollbar is visible (your requirement)
  const addButtonClassName = useMemo(() => {
    const classes = ["btn", "btn-success", "btn-md"];
    if (hasWindowScrollbar) classes.push("me-3");
    return classes.join(" ");
  }, [hasWindowScrollbar]);

  const extraHeaderActions = useMemo(
    () => (
      <button
        type="button"
        className="btn btn-primary btn-md meter-reading-entry-btn me-2"
        onClick={() => setIsEntryOpen(true)}
      >
        <i className="fa fa-bolt me-2" />
        Bulk Meter Reading Entry
      </button>
    ),
    []
  );

  return (
    <>
      <SharedListingPage
        title="MANAGE METER READINGS"
        ListingComponent={MeterReadingListing}
        listingKey={listingKey}
        contentClassName={contentClassName}
        extraHeaderActions={extraHeaderActions}
        addButtonClassName={addButtonClassName}
      />

      <MeterReadingEntryModal
        isOpen={isEntryOpen}
        onClose={() => setIsEntryOpen(false)}
      />
    </>
  );
};

export default MeterReadingListingPage;
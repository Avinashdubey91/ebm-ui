// Patch Start: src/features/electricity/meterReadings/MeterReadingListingPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import SharedListingPage from "../../../shared/SharedListingPage";
import MeterReadingListing from "../forms/MeterReadingListing";
import MeterReadingEntryModal from "../forms/MeterReadingEntryModal";

const useHasWindowVerticalScrollbar = (): boolean => {
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    const update = () => {
      const docEl = document.documentElement;
      // When vertical scrollbar is present, clientWidth becomes smaller than innerWidth
      setHasScrollbar(window.innerWidth > docEl.clientWidth);
    };

    update();

    window.addEventListener("resize", update);

    const ro = new ResizeObserver(() => {
      update();
    });

    // body resize covers most content changes (pagination/page size/expanded rows)
    ro.observe(document.body);

    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  return hasScrollbar;
};

const MeterReadingListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [listingKey, setListingKey] = useState(0);

  const hasWindowScrollbar = useHasWindowVerticalScrollbar();

  useEffect(() => {
    const onRefresh = () => setListingKey((k) => k + 1);
    window.addEventListener("meterReadingEntry:refresh", onRefresh);
    return () => window.removeEventListener("meterReadingEntry:refresh", onRefresh);
  }, []);

  const contentClassName = hasWindowScrollbar ? "me-3" : "";

  const addBtnClassName = useMemo(() => {
    const classes = ["btn", "btn-success", "btn-md", "ms-2"];
    if (hasWindowScrollbar) classes.push("me-3");
    return classes.join(" ");
  }, [hasWindowScrollbar]);

  const headerActions = useMemo(
    () => (
      <>
        <button
          type="button"
          className="btn btn-primary btn-md meter-reading-entry-btn"
          onClick={() => setIsEntryOpen(true)}
        >
          <i className="fa fa-bolt me-2" />
          Bulk Meter Reading Entry
        </button>

        <button
          type="button"
          className={addBtnClassName}
          onClick={() => navigate("add")}
        >
          <i className="fa fa-plus me-2" />
          Add New Meter Reading
        </button>
      </>
    ),
    [navigate, addBtnClassName]
  );

  return (
    <>
      <SharedListingPage
        title="MANAGE METER READINGS"
        ListingComponent={MeterReadingListing}
        headerActions={headerActions}
        listingKey={listingKey}
        contentClassName={contentClassName}
      />

      <MeterReadingEntryModal
        isOpen={isEntryOpen}
        onClose={() => setIsEntryOpen(false)}
      />
    </>
  );
};

export default MeterReadingListingPage;
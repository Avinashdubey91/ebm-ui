import React from "react";
interface SharedListingPageProps {
    title?: string;
    ListingComponent: React.FC;
    /**
     * Custom actions on the right side of the header.
     * If provided, it replaces the default "Add New" button.
     */
    headerActions?: React.ReactNode;
    /**
     * Extra actions rendered BEFORE the default "Add New" button.
     * This does NOT replace the default button.
     */
    extraHeaderActions?: React.ReactNode;
    /**
     * Optional className for the default "Add New" button.
     * Useful when you need conditional spacing (e.g., scrollbar appears).
     */
    addButtonClassName?: string;
    /**
     * Changing this value forces the listing component to remount.
     * Useful when you need a clean reload (e.g. after modal save).
     */
    listingKey?: React.Key;
    /** Optional className applied to the listing content wrapper. */
    contentClassName?: string;
}
declare const _default: React.NamedExoticComponent<SharedListingPageProps>;
export default _default;

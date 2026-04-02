import React from "react";
import "./MeterReading.css";
import "../../../../styles/_forms.scss";
type Props = {
    isOpen: boolean;
    onClose: () => void;
};
declare const MeterReadingEntryModal: React.FC<Props>;
export default MeterReadingEntryModal;

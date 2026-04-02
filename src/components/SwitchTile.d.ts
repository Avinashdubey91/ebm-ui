import React from "react";
type Props = {
    id: string;
    name: string;
    label: string;
    checked: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
};
declare const SwitchTile: React.FC<Props>;
export default SwitchTile;

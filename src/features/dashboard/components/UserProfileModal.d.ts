import React from "react";
import type { UserDTO } from "../../../types/UserDTO";
interface Props {
    isOpen: boolean;
    onClose: () => void;
    profile: UserDTO | null;
}
declare const UserProfileModal: React.FC<Props>;
export default UserProfileModal;

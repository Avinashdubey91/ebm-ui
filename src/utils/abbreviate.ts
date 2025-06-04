export const abbreviateRole = (role?: string): string => {
  if (!role) return "-";
  const words = role.trim().split(/\s+/);

  if (words.length > 1) {
    const [first, ...rest] = words;
    return `${first[0].toUpperCase()}. ${rest.join(" ")}`; // Super Admin → S. Admin
  }

  return role.length > 8 ? role.slice(0, 5) : role; // Administrator → Admin.
};

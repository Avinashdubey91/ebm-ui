// src/utils/renderImageThumbnail.tsx
import { type JSX } from "react";

export const renderImageThumbnail = (imagePath?: string): JSX.Element => {
  const isValid =
    imagePath && imagePath.trim() !== "" && imagePath.trim().toLowerCase() !== "string";

  const fullUrl = `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "")}/${imagePath}`;

  return isValid ? (
    <img
      src={fullUrl}
      alt="User"
      width={70}
      height={70}
      style={{
        objectFit: "cover",
        borderRadius: "6px",
        border: "1px solid #ccc",
      }}
    />
  ) : (
    <strong>
      <span style={{ color: "#e0552b" }}>#NA</span>
    </strong>
  );
};

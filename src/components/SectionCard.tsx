import React from "react";

type Props = React.PropsWithChildren<{ title: string }>;

const SectionCard: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="border rounded-3 p-3">
      <div className="fw-bold mb-3">{title}</div>
      {children}
    </div>
  );
};

export default SectionCard;
import React from "react";
import TextAtom from "@/components/atoms/TextAtom";

function HistoryHeader({ labels }) {
  return (
    <thead>
      <tr className="rounded-t-xl bg-[#1E40AF] text-white">
        {labels.map((label, index) => (
          <th className="px-5 py-4" key={index}>
            <TextAtom text={label} />
          </th>
        ))}
      </tr>
    </thead>
  );
}

export default HistoryHeader;

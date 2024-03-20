import React from "react";
import TextAtom from "@/components/atoms/TextAtom";
import RoundBtnAtom from "@/components/atoms/RoundBtnAtom";

function PipelineRow({ pipeline, onStateClick, onHistoryClick }) {
  const btnProperties = ["rounded-full", "bg-[#57ba46]", "px-3", "py-2", "mx-2"];

  return (
    <div className="flex flex-row justify-between py-3 px-10 rounded-2xl font-semibold bg-[#1E40AF] mb-2">
      <TextAtom properties={"px-3 py-2"} text={pipeline} />
      <div>
        <RoundBtnAtom
          properties={btnProperties}
          onClick={() => onStateClick(pipeline)}
          text={"Dashboard"}
        />
        <RoundBtnAtom
          properties={btnProperties}
          onClick={() => onHistoryClick(pipeline)}
          text={"History"}
        />
      </div>
    </div>
  );
}

export default PipelineRow;

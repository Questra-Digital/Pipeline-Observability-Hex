import React from "react";
import PipelineRow from "@/Components/molecules/Pipelines/PipelineRow";
import TextAtom from "@/Components/atoms/TextAtom";

function PipelinesList({ pipelines, onStateClick, onHistoryClick }) {
  return (
    <div className="flex flex-col justify-between md:w-[70%] w-[100%] my-10">
      <div className="flex flex-row justify-between py-3 px-2 md:px-10 rounded-2xl bg-slate-500 mb-5 font-bold text-md">
        <TextAtom properties={"mx-2"} text={"Name"} />
        <TextAtom properties={"font-bold h-full"} text={"|"} />
        <TextAtom properties={"mx-2"} text={"Actions"} />
      </div>
      {pipelines.map((pipeline, index) => (
        <PipelineRow
          key={index}
          pipeline={pipeline}
          onStateClick={onStateClick}
          onHistoryClick={onHistoryClick}
        />
      ))}
    </div>
  );
}

export default PipelinesList;

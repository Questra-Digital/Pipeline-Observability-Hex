import React from "react";
import TextAtom from "@/Components/atoms/TextAtom";

function PipelineDataRow({ data }) {
  return (
    <div className="flex items-center justify-between flex-wrap rounded-xl px-5 py-2 bg-blue-300 w-[90%] my-px">
      <TextAtom text={data.pipeline_name} properties="my-px" />
      <TextAtom text={data.summary.deployment} properties="my-px" />
      <TextAtom text={data.summary.service} properties="my-px" />
      <TextAtom text={data.summary.pod} properties="my-px" />
      <TextAtom text={data.summary.replicaSet} properties="my-px" />
      <TextAtom text={data.time} properties="my-px" />
    </div>
  );
}

export default PipelineDataRow;
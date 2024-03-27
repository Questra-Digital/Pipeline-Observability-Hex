import React from "react";
import TextAtom from "@/components/atoms/TextAtom";

function PipelineDataRow({ data }) {
  return (
    <tr className="bg-blue-300 text-center even:bg-gray-500 odd:bg-gray-700">
      <td className="px-5 py-3">
        <TextAtom text={data.time} />
      </td>
      <td className="px-4 py-3">
        <TextAtom text={data.summary.deployment} />
      </td>
      <td className="px-4 py-3">
        <TextAtom text={data.summary.service} />
      </td>
      <td className="px-4 py-3">
        <TextAtom text={data.summary.pod} />
      </td>
      <td className="px-4 py-3">
        <TextAtom text={data.summary.replicaSet} />
      </td>
    </tr>
  );
}

export default PipelineDataRow;

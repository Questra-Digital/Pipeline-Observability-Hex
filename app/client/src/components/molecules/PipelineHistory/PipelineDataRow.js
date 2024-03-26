import React from "react";
import TextAtom from "@/components/atoms/TextAtom";

function PipelineDataRow({ data }) {
  return (
    <tr className="bg-blue-300 text-center even:bg-gray-500 odd:bg-gray-700">
      <td className="px-5 py-2">
        <TextAtom text={data.time} />
      </td>
      <td className="px-4 py-2">
        <TextAtom
          text={data.summary.deployment}
          properties={` ${
            data?.summary?.deployment === "Healthy"
              ? "bg-green-600"
              : "bg-rose-500"
          }`}
        />
      </td>
      <td className="px-4 py-2">
        <TextAtom
          text={data.summary.service}
          properties={`${
            data?.summary?.service === "Healthy"
              ? "bg-green-600"
              : "bg-rose-500"
          }`}
        />
      </td>
      <td className="px-4 py-2">
        <TextAtom
          text={data.summary.pod}
          properties={`${
            data?.summary?.pod === "Healthy" ? "bg-green-600" : "bg-rose-500"
          }`}
        />
      </td>
      <td className="px-4 py-2">
        <TextAtom
          text={data.summary.replicaSet}
          properties={`${
            data?.summary?.replicaSet === "Healthy"
              ? "bg-green-600"
              : "bg-rose-500"
          }`}
        />
      </td>
    </tr>
  );
}

export default PipelineDataRow;

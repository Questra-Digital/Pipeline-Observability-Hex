import TextAtom from "@/Components/atoms/TextAtom";

function HistoryHeader({ labels, pipelineName }) {
  return (
    <>
      <TextAtom
        text={"Pipeline History | "}
        properties={
          "pl-4 sm:pl-10 md:pl-20 font-semibold text-2xl my-10 self-start"
        }
      >
        <span className="text-gray-400 text-2xl">{pipelineName}</span>
      </TextAtom>
      <div className="flex items-center justify-between flex-wrap rounded-xl px-5 py-2 bg-[#1E40AF] w-[90%] my-5 gap-4">
        {labels.map((label, index) => (
          <TextAtom properties={"my-px flex-grow"} text={label} key={index} />
        ))}
      </div>
    </>
  );
}

export default HistoryHeader;

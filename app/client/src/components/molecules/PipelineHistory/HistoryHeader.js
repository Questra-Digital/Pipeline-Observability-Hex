import BackButton from "@/components/atoms/BackButton";
import TextAtom from "@/components/atoms/TextAtom";

function HistoryHeader({ labels, pipelineName }) {
  return (
    <>
      <BackButton/>
      <div className="flex items-center justify-between flex-wrap rounded-xl px-5 py-2 bg-[#1E40AF] w-[90%] my-3 gap-4">
        {labels.map((label, index) => (
          <TextAtom properties={"my-px flex-grow"} text={label} key={index} />
        ))}
      </div>
    </>
  );
}

export default HistoryHeader;

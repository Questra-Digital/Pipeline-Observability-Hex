import ImageAtom from "@/Components/atoms/ImageAtom";
import Link from "next/link";

const AppCard = ({ imageURL, alt, name, url, status }) => {
  return (
    <>
      <div className="border overflow-hidden border-gray-500 w-[170px] h-[150px] rounded-md flex flex-col justify-between items-center pt-4 hover:scale-105 duration-300 hover:shadow-lg hover:shadow-gray-600">
        <div className="flex flex-col h-full w-full items-center justify-center">
          <ImageAtom src={imageURL} height={30} width={30} alt={alt} />
          <p className="my-3 text-gray-200">{name}</p>
        </div>
        <div
          className={`w-full flex justify-center ${
            status
              ? "bg-green-600 text-white"
              : "bg-gray-500 text-white"
          }`}
        >
          <Link className={`w-full py-2 text-center`} href={url ? url : ""}>
            {status ? "Configured" : "Configure"}
          </Link>
        </div>
      </div>
    </>
  );
};

export default AppCard;

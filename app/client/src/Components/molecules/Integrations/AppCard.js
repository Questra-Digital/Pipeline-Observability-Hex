import ImageAtom from "@/Components/atoms/ImageAtom";
import Link from "next/link";

const AppCard = ({ imageURL, alt, name, url, status }) => {
  return (
    <>
      <div className="border-2 overflow-hidden border-gray-500 w-[200px] h-[170px] rounded-xl flex flex-col justify-between items-center pt-4 hover:scale-105 duration-300 hover:shadow-lg hover:shadow-gray-600">
        <div className="flex flex-col h-full w-full items-center justify-center">
          <ImageAtom src={imageURL} height={40} width={40} alt={alt} />
          <p className="my-3 text-lg text-gray-200">{name}</p>
        </div>
        <div
          className={`w-full font-semibold tracking-wide flex justify-center ${
            status
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          <Link className={`w-full py-2 text-center`} href={url ? url : ""}>
            {status ? "Uninstall" : "Install"}
          </Link>
        </div>
      </div>
    </>
  );
};

export default AppCard;

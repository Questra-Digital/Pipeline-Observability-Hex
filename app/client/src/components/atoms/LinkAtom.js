import Link from "next/link";

const LinkAtom = ({children, text, link, prefetch, properties, click}) => {
  return (
    <div>
      <Link
        href={link}
        prefetch={prefetch}
        className={`${properties}`}
        onClick={click}
      >
        {text}
        {children}
      </Link>
    </div>
  );
};

export default LinkAtom;

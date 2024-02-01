import Link from "next/link";

const LinkAtom = ({children, text, link, prefetch, properties}) => {
  return (
    <div>
      <Link
        href={link}
        prefetch={prefetch}
        className={`${properties}`}
      >
        {text}
        {children}
      </Link>
    </div>
  );
};

export default LinkAtom;

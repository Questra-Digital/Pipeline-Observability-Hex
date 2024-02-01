const RoundBtnAtom = ({ text, onClick, properties }) => {
  const additionalClasses = properties ? properties.join(" ") : "";

  return (
    <button
      className={`px-5 py-2 rounded-full mx-1 text-md transform duration-300 ease-linear ${additionalClasses}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default RoundBtnAtom;

const Modal = ({ isOpen, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center">
      <div className="bg-gray-700 p-5 rounded-lg md:w-[400px] shadow shadow-purple-700">
        <div className="flex flex-col gap-5">
          {title && <p className="text-2xl font-semibold mb-4">{title}</p>}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

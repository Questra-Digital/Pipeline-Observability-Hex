"use client";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0a0a0a] border border-red-900/20 rounded-[2.5rem] shadow-[0_0_100px_rgba(220,38,38,0.1)] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import ImageAtom from "@/components/atoms/ImageAtom";
import LinkAtom from "@/components/atoms/LinkAtom";
import Modal from "../atoms/Modal";
import { deleteUser } from "@/redux/features/user/userSlice";
import { dashboardTabs } from "@/constants/dashboardLinks";

const Sidebar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (userData.email) {
      setUserEmail(userData.email);
      const name = userData.name || userData.email.split("@")[0].toUpperCase();
      setUserName(name);
    }
  }, []);

  const handleLogout = () => {
    dispatch(deleteUser());
    setShowModal(false);
    router.push("/");
  };

  const isTabActive = (link) => pathname === link;

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#1c1c1c] text-[#e0e0e0] transition-all duration-300 ${
        isCollapsed ? "w-[4rem]" : "w-full lg:w-[360px]"
      }`}
    >
      {/* LOGO */}
      <div className="p-4 flex items-center gap-3">
        <ImageAtom
          src="http://127.0.0.1:1337/uploads/logo_51f23fb97c.png"
          width={40}
          height={40}
          alt="VIZOPS Icon"
          properties={["object-cover w-10 h-10 rounded-lg"]}
        />

        {!isCollapsed && (
          <div>
            <p className="text-lg font-bold text-[#ffffff]">VIZOPS</p>
            <p className="text-xs text-[#a0a0a0] uppercase tracking-wide">
              Pipeline Observability
            </p>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <div className="flex-grow overflow-y-auto px-3 py-2">
        <div className="bg-[#222222] rounded-xl p-3 border border-[#2b2b2b]">
          <nav className="space-y-1">
            {dashboardTabs.map((tab, index) => (
              <LinkAtom link={tab.link} key={index}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm uppercase tracking-wide transition-all 
                    ${
                      isTabActive(tab.link)
                        ? "bg-[#2a2a2a] text-[#ffffff] border-l-2 border-[#3b82f6]"
                        : "text-[#c0c0c0] hover:bg-[#2b2b2b] hover:text-[#ffffff]"
                    }
                    ${isCollapsed ? "justify-center px-2" : ""}
                  `}
                >
                  <ImageAtom
                    src={tab.icon}
                    width={20}
                    height={20}
                    alt={tab.alt}
                    properties={["w-5 h-5 shrink-0"]}
                  />

                  {!isCollapsed && (
                    <span className="truncate text-xs font-medium">
                      {tab.name}
                    </span>
                  )}
                </div>
              </LinkAtom>
            ))}
          </nav>
        </div>
      </div>

      {/* USER SECTION */}
      <div className="px-3 pb-3">
        <div className="bg-[#222222] rounded-xl p-3 border border-[#2b2b2b]">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2 h-2 bg-[#3b82f6] rounded-sm"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">
              User
            </span>
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-lg bg-[#1f1f1f] ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            {/* PROFILE IMAGE */}
            <ImageAtom
              src="/assets/Images/profile.png"
              width={44}
              height={44}
              alt="Profile"
              properties={["w-11 h-11 rounded-lg object-cover"]}
            />

            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#ffffff] truncate uppercase">
                    {userName}
                  </p>
                  <p className="text-xs text-[#a0a0a0] truncate">
                    {userEmail}
                  </p>
                </div>

                {/* MENU */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="p-1.5 hover:bg-[#2c2c2c] rounded"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                  </button>

                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute bottom-full mb-2 right-0 w-40 bg-[#1f1f1f] rounded-lg shadow-lg border border-[#2c2c2c] py-1 z-20">
                        <button
                          onClick={() => setShowModal(true)}
                          className="w-full text-left px-4 py-2 text-sm text-[#f87171] hover:bg-[#2c2c2c]"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* LOGOUT MODAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Logout Confirmation">
        <div className="flex flex-col gap-5 text-[#e0e0e0]">
          <p className="text-lg">Are you sure you want to logout?</p>
          <div className="flex justify-end gap-2">
            <button
              className="bg-[#b91c1c] hover:bg-[#991b1b] text-white px-7 py-2 rounded border border-[#7f1d1d]"
              onClick={handleLogout}
            >
              Yes
            </button>
            <button
              className="bg-[#555555] hover:bg-[#444444] text-white px-7 py-2 rounded border border-[#333333]"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;

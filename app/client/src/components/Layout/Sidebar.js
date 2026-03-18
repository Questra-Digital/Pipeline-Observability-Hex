"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import ImageAtom from "@/components/atoms/ImageAtom";
import LinkAtom from "@/components/atoms/LinkAtom";
import Modal from "../atoms/Modal";
import { VizOpsLogo } from "../atoms/AppIcons";
import { deleteUser } from "@/redux/features/user/userSlice";
import { dashboardTabs } from "@/constants/dashboardLinks";

const Sidebar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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
    setShowLogoutModal(false);
    router.push("/");
  };

  const isTabActive = (link) => pathname === link;

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#050505] text-[#e0e0e0] border-r border-red-900/10 transition-all duration-300 ${isCollapsed ? "w-[4rem]" : "w-full lg:w-[360px]"
        }`}
    >
      {/* LOGO */}
      <div className="p-8 flex items-center gap-4">
        <VizOpsLogo size={40} className="text-red-600 animate-pulse drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />

        {!isCollapsed && (
          <div className="flex flex-col">
            <p className="text-2xl font-black text-white tracking-tighter uppercase italic">VIZOPS</p>
            <p className="text-[10px] text-red-500 font-mono tracking-[0.3em] uppercase opacity-70">
              Observability Link
            </p>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <div className="flex-grow overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="bg-[#0a0a0a] rounded-[2rem] p-4 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 px-4">
            <div className="w-1 h-3 bg-red-600 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Core Navigation</span>
          </div>
          <nav className="space-y-2">
            {dashboardTabs.map((tab, index) => (
              <LinkAtom link={tab.link} key={index}>
                <div
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500
                    ${isTabActive(tab.link)
                      ? "bg-red-600/10 text-white border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                      : "text-gray-500 hover:bg-white/5 hover:text-white"
                    }
                    ${isCollapsed ? "justify-center px-2" : ""}
                  `}
                >
                  {tab.Icon && (
                    <tab.Icon size={20} className={`shrink-0 transition-colors duration-500 ${isTabActive(tab.link) ? "text-red-500" : "text-gray-700"}`} />
                  )}

                  {!isCollapsed && (
                    <span className="truncate">
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
      <div className="px-4 pb-6">
        <div className="bg-[#0a0a0a] rounded-[2rem] p-5 border border-white/5 relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full translate-x-12 -translate-y-12"></div>

          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.6)]"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600">
              Session Profile
            </span>
          </div>

          <div
            className={`flex items-center gap-4 p-4 rounded-2xl bg-black border border-white/5 transition-all duration-500 group-hover:border-red-600/20 ${isCollapsed ? "justify-center" : ""
              }`}
          >
            {/* PROFILE IMAGE */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <ImageAtom
                src="/assets/Images/profile.png"
                width={48}
                height={48}
                alt="Profile"
                properties={["w-12 h-12 rounded-xl object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500 border border-white/10"]}
              />
            </div>

            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate uppercase italic tracking-tight">
                    {userName}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate font-mono mt-0.5">
                    {userEmail}
                  </p>
                </div>

                {/* MENU */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-red-500"
                  >
                    <svg
                      width="20"
                      height="20"
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
                        className="fixed inset-0 z-50"
                        onClick={() => setShowProfileMenu(false)}
                      />
                      <div className="absolute bottom-full mb-4 right-0 w-44 bg-[#0d0d0d] rounded-2xl shadow-2xl border border-white/5 p-2 z-[60] animate-in slide-in-from-bottom-2 duration-300">
                        <button
                          onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}
                          className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Profile
                        </button>
                        <div className="h-px bg-white/5 my-1 mx-2"></div>
                        <button
                          onClick={() => { setShowLogoutModal(true); setShowProfileMenu(false); }}
                          className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-600/10 rounded-xl transition-all flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} hideHeader>
        <div className="bg-[#0a0a0a] border border-red-600/30 rounded-[2.5rem] p-12 flex flex-col items-center text-center shadow-[0_0_100px_rgba(220,38,38,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

          <div className="w-24 h-24 rounded-3xl bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-8 shadow-inner group">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </div>

          <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Confirm Logout</h3>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-xs mb-10">
            Are you sure you want to log out of your VizOps account? you will need to authenticate again to access your dashboard.
          </p>

          <div className="flex w-full gap-4">
            <button
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-red-600/20 active:scale-95"
              onClick={handleLogout}
            >
              Log Out
            </button>
            <button
              className="flex-1 bg-black border border-white/10 hover:border-white/30 text-gray-400 hover:text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* PROFILE MODAL */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} hideHeader>
        <div className="bg-[#0a0a0a] border border-red-600/30 rounded-[2.5rem] p-12 flex flex-col shadow-[0_0_100px_rgba(220,38,38,0.15)] relative overflow-hidden min-w-[450px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] -translate-y-32 translate-x-32"></div>

          <div className="flex items-center gap-6 mb-12">
            <div className="relative">
              <div className="absolute inset-x-0 -bottom-2 h-1 w-12 mx-auto bg-red-600 blur-md opacity-50"></div>
              <ImageAtom
                src="/assets/Images/profile.png"
                width={80}
                height={80}
                alt="Profile"
                properties={["w-20 h-20 rounded-[2rem] object-cover border border-red-600/30 p-1 bg-black shadow-2xl shadow-red-600/10"]}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-red-600 font-black uppercase tracking-[0.4em] mb-1">Access Level: Prime</span>
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">{userName}</h3>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">User ID</span>
                <span className="text-xs font-mono text-gray-400">USR-7742-X</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Email Address</span>
                <span className="text-xs font-mono text-red-500">{userEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Auth Status</span>
                <span className="text-xs font-mono text-emerald-500">Verified</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-red-950/10 border border-red-600/20 rounded-3xl text-center">
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Role</p>
                <p className="text-xs text-red-500 font-black uppercase tracking-tight italic">Administrator</p>
              </div>
              <div className="p-6 bg-red-950/10 border border-red-600/20 rounded-3xl text-center">
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Deployments</p>
                <p className="text-xs text-red-500 font-black uppercase tracking-tight italic">Active</p>
              </div>
            </div>
          </div>

          <button
            className="mt-12 w-full bg-black border border-white/10 hover:border-red-600/40 text-gray-400 hover:text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 group"
            onClick={() => setShowProfileModal(false)}
          >
            Return TO Dashboard <span className="text-red-600 group-hover:translate-x-1 inline-block transition-transform ml-2">→</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;

'use client'
import Sidebar from "@/components/Layout/Sidebar";
import withAuth from "@/components/withAuth";

const DashboardLayout = ({ children }) => {
  return (
    <section className="flex min-h-screen w-full max-w-[100vw] bg-[#141414] overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-screen min-w-0">
        {/* Scrollable Central Content */}
        <div className="flex-1 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar min-w-0">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default withAuth(DashboardLayout);

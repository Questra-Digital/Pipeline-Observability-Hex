'use client'
import Sidebar from "@/components/Layout/Sidebar";
import withAuth from "@/components/withAuth";

const DashboardLayout = ({ children }) => {
  return (
    <section className="flex min-h-screen w-screen bg-[#141414] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-screen">
        {/* Scrollable Central Content */}
        <div className="flex-1 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default withAuth(DashboardLayout);

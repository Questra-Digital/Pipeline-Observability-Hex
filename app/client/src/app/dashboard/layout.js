'use client'
import Sidebar from "@/components/Layout/Sidebar";
import Widget from "@/components/Layout/Widget";
import withAuth from "@/components/withAuth";

const DashboardLayout = ({ children }) => {
  const widgetData = {
    temperature: "72°F",
    location: "Lahore, PK",
    timezone: "PKT"
  };

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

        {/* Right Sidebar */}
        <div className="hidden lg:block w-[360px] bg-[#1c1c1c] border-l border-[#2b2b2b] h-screen overflow-y-auto sticky top-0 custom-scrollbar">
          <div className="p-4 space-y-4">
            <Widget widgetData={widgetData} />
            {/* Additional widgets here */}
          </div>
        </div>
      </div>
    </section>
  );
}

export default withAuth(DashboardLayout);

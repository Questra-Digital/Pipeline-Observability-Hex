'use client'
import Sidebar from "@/components/Layout/Sidebar";
import Navbar from "@/components/Layout/Navbar";
import withAuth from "@/components/withAuth";

const DashboardLayout = ({
  children,
}) => {
  return (
      <section>
      <div className="flex min-h-screen max-h-screen w-screen">
        <Sidebar />
        <div className="flex flex-col w-full min-h-full">
          <Navbar />
          <div className="w-full h-full overflow-y-scroll overflow-x-hidden custom-scrollbar flex justify-center items-start">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default withAuth(DashboardLayout);
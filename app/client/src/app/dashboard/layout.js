import Sidebar from "@/Components/Layout/Sidebar";
import Navbar from "@/Components/Layout/Navbar";


export default function DashboardLayout({
  children, // will be a page or nested layout
}) {
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

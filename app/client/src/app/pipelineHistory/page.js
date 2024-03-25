import PipelineHistory from "@/components/organisms/PipelineHistory";
import React from "react";
import DashboardLayout from "../dashboard/layout";

const page = () => {
  return (
    <DashboardLayout>
      <PipelineHistory />
    </DashboardLayout>
  );
};

export default page;

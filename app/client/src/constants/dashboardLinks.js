import {
  HomeIcon,
  DashboardIcon,
  IntegrationsIcon,
  SettingsIcon,
  TicketIcon,
  AgentIcon,
} from "@/components/atoms/AppIcons";

export const dashboardTabs = [
  {
    name: "Home",
    link: "/home",
    Icon: HomeIcon,
    alt: "Home Icon",
  },
  {
    name: "Dashboard",
    link: "/dashboard",
    Icon: DashboardIcon,
    alt: "Dashboard Icon",
  },
  {
    name: "Integrations",
    link: "/integrations",
    Icon: IntegrationsIcon,
    alt: "Integrations Icon",
  },
  {
    name: "Automated Tickets",
    link: "/dashboard/tickets",
    Icon: TicketIcon,
    alt: "Ticket Icon",
  },
  {
    name: "Agent Control",
    link: "/dashboard/github-actions",
    Icon: AgentIcon,
    alt: "Agent Control Icon",
  },
  {
    name: "Settings",
    link: "/dashboard/settings",
    Icon: SettingsIcon,
    alt: "Settings Icon",
  },
];

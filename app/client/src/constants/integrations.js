// @/constants/integrations.js

import ArgoCD from "@/components/molecules/Forms/ConfigureApps/ArgoCD";
import Gmail from "@/components/molecules/Forms/ConfigureApps/Gmail";
import Slack from "@/components/molecules/Forms/ConfigureApps/Slack";
import GitHubAuthForm from "@/components/molecules/Forms/ConfigureApps/GitHubAuthForm";
import {
  ArgoCDIcon,
  SlackIcon,
  GmailIcon,
  GitHubIcon,
  GitLabIcon,
  JenkinsIcon,
  DroneIcon
} from "@/components/atoms/AppIcons";

export const allApps = [
  {
    name: "argocd",
    Icon: ArgoCDIcon,
    image: "", // Cleared broken Strapi URL
    alt: "ArgoCD Icon",
    status: true,
    component: ArgoCD,
  },
  {
    name: "slack",
    Icon: SlackIcon,
    image: "",
    alt: "Slack Icon",
    status: false,
    component: Slack,
  },
  {
    name: "email",
    Icon: GmailIcon,
    image: "",
    alt: "Gmail Icon",
    status: false,
    component: Gmail,
  },
  {
    name: "gitlab",
    Icon: GitLabIcon,
    image: "",
    alt: "GitLab Icon",
    status: false,
    component: null,
  },
  {
    name: "jenkins",
    Icon: JenkinsIcon,
    image: "",
    alt: "Jenkins Icon",
    status: false,
    component: null,
  },
  {
    name: "drone CI",
    Icon: DroneIcon,
    image: "",
    alt: "Drone CI Icon",
    status: false,
    component: null,
  },
  {
    name: "github",
    Icon: GitHubIcon,
    image: "",
    alt: "GitHub Icon",
    status: false,
    component: GitHubAuthForm,
  },
];
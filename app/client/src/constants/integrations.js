import ArgoCD from "@/components/molecules/Forms/ConfigureApps/ArgoCD";
import Gmail from "@/components/molecules/Forms/ConfigureApps/Gmail";
import Slack from "@/components/molecules/Forms/ConfigureApps/Slack";

export const allApps = [
  {
    name: "argocd",
    image: "/assets/Images/argocd.png",
    alt: "ArgoCD Icon",
    status: false,
    component: ArgoCD
  },
  {
    name: "slack",
    image: "/assets/Images/slack.png",
    alt: "Slack Icon",
    status: true,
    component: Slack
  },
  {
    name: "email",
    image: "/assets/Images/gmail.png",
    alt: "Gmail Icon",
    status: false,
    component: Gmail
  },
  {
    name: "gitlab",
    image: "/assets/Images/gitlab.png",
    alt: "GitLab Icon",
    status: false,
    component: null
  },
  {
    name: "jenkins",
    image: "/assets/Images/jenkins.png",
    alt: "Jenkins Icon",
    status: false,
    component: null

  },
  {
    name: "github actions",
    image: "/assets/Images/ghactions.png",
    alt: "GitHub Actions Icon",
    status: false,
    component: null
  },
  {
    name: "drone CI",
    image: "/assets/Images/droneci.png",
    alt: "Drone CI Icon",
    status: false,
    component: null
  },
];

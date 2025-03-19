import ArgoCD from "@/components/molecules/Forms/ConfigureApps/ArgoCD";
import Gmail from "@/components/molecules/Forms/ConfigureApps/Gmail";
import Slack from "@/components/molecules/Forms/ConfigureApps/Slack";

export const allApps = [
  {
    name: "argocd",
    image: "http://localhost:1337/uploads/argocd_f8ad46a182.png",
    alt: "ArgoCD Icon",
    status: false,
    component: ArgoCD,
  },
  {
    name: "slack",
    image: "http://localhost:1337/uploads/slack_626f465a44.png",
    alt: "Slack Icon",
    status: true,
    component: Slack,
  },
  {
    name: "email",
    image: "http://localhost:1337/uploads/gmail_a554734198.png",
    alt: "Gmail Icon",
    status: false,
    component: Gmail,
  },
  {
    name: "gitlab",
    image: "http://localhost:1337/uploads/gitlab_3036171b2b.png",
    alt: "GitLab Icon",
    status: false,
    component: null,
  },
  {
    name: "jenkins",
    image: "http://localhost:1337/uploads/jenkins_bd01220a31.png",
    alt: "Jenkins Icon",
    status: false,
    component: null,
  },
  {
    name: "github actions",
    image: "http://localhost:1337/uploads/ghactions_58e6982f06.png",
    alt: "GitHub Actions Icon",
    status: false,
    component: null,
  },
  {
    name: "drone CI",
    image: "http://localhost:1337/uploads/droneci_336077abe4.png",
    alt: "Drone CI Icon",
    status: false,
    component: null,
  },
];

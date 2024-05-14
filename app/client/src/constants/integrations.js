import ArgoCD from "@/components/molecules/Forms/ConfigureApps/ArgoCD";
import Gmail from "@/components/molecules/Forms/ConfigureApps/Gmail";
import Slack from "@/components/molecules/Forms/ConfigureApps/Slack";

export const allApps = [
  {
    name: "argocd",
    image: "http://localhost:1337/uploads/argocd_d150e02a65.png",
    alt: "ArgoCD Icon",
    status: false,
    component: ArgoCD
  },
  {
    name: "slack",
    image: "http://localhost:1337/uploads/slack_cb21f75821.png",
    alt: "Slack Icon",
    status: true,
    component: Slack
  },
  {
    name: "email",
    image: "http://localhost:1337/uploads/gmail_c1147f7a81.png",
    alt: "Gmail Icon",
    status: false,
    component: Gmail
  },
  {
    name: "gitlab",
    image: "http://localhost:1337/uploads/gitlab_b78715ebd3.png",
    alt: "GitLab Icon",
    status: false,
    component: null
  },
  {
    name: "jenkins",
    image: "http://localhost:1337/uploads/jenkins_d034aaa3aa.png",
    alt: "Jenkins Icon",
    status: false,
    component: null

  },
  {
    name: "github actions",
    image: "http://localhost:1337/uploads/ghactions_89577ec862.png",
    alt: "GitHub Actions Icon",
    status: false,
    component: null
  },
  {
    name: "drone CI",
    image: "http://localhost:1337/uploads/droneci_71b923b274.png",
    alt: "Drone CI Icon",
    status: false,
    component: null
  },
];

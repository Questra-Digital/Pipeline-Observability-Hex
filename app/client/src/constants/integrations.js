// @/constants/integrations.js

import ArgoCD from "@/components/molecules/Forms/ConfigureApps/ArgoCD";
import Gmail from "@/components/molecules/Forms/ConfigureApps/Gmail";
import Slack from "@/components/molecules/Forms/ConfigureApps/Slack";
import GithubActions from "@/components/molecules/Forms/ConfigureApps/GithubActions";

export const allApps = [
  {
    name: "argocd",
    image: "http://127.0.0.1:1337/uploads/argocd_f8ad46a182_34ae5d1033.png",
    alt: "ArgoCD Icon",
    status: true,
    component: ArgoCD,
  },
  {
    name: "slack",
    image: "http://127.0.0.1:1337/uploads/slack_626f465a44.png",
    alt: "Slack Icon",
    status: false,
    component: Slack,
  },
  {
    name: "email",
    image: "http://127.0.0.1:1337/uploads/gmail_a554734198.png",
    alt: "Gmail Icon",
    status: false,
    component: Gmail,
  },
  {
    name: "gitlab",
    image: "http://127.0.0.1:1337/uploads/gitlab_3036171b2b.png",
    alt: "GitLab Icon",
    status: false,
    component: null,
  },
  {
    name: "jenkins",
    image: "http://127.0.0.1:1337/uploads/jenkins_bd01220a31.png",
    alt: "Jenkins Icon",
    status: false,
    component: null,
  },
  {
    name: "github actions",
    image: "http://127.0.0.1:1337/uploads/ghactions_58e6982f06.png",
    alt: "GitHub Actions Icon",
    status: false,
    component: GithubActions, // ← Changed from null to GithubActions
  },
  {
    name: "drone CI",
    image: "http://127.0.0.1:1337/uploads/droneci_336077abe4.png",
    alt: "Drone CI Icon",
    status: false,
    component: null,
  },
];
import ToggleGmailNotification from "@/components/molecules/Settings/ToggleGmailNotification";
import ToggleSlackNotification from "@/components/molecules/Settings/ToggleSlackNotification";
import UpdateArgoCDUrl from "@/components/molecules/Settings/UpdateArgoCDUrl";
import UpdateCompanyName from "@/components/molecules/Settings/UpdateCompanyName";
import UpdateDeviationValue from "@/components/molecules/Settings/UpdateDeviationValue";
import UpdateEmail from "@/components/molecules/Settings/UpdateEmail";
import UpdateMessage from "@/components/molecules/Settings/UpdateMessage";
import UpdatePassword from "@/components/molecules/Settings/UpdatePassword";
import UpdatePipelineObservability from "@/components/molecules/Settings/UpdatePipelineObservability";
import UpdateSenderEmail from "@/components/molecules/Settings/UpdateSenderEmail";
import UpdateToken from "@/components/molecules/Settings/UpdateToken";

export const settingsOptions = [
  {
    name: "General",
    state: "user",
    childOptions: [
      {
        name: "Email",
        state: "email",
        component: UpdateEmail,
      },
      {
        name: "Sender Email",
        state: "SenderEmail",
        component: UpdateSenderEmail,
      },
      // {
      //     name: 'Company Name',
      //     state: 'company',
      //     component: UpdateCompanyName
      // },
      {
        name: "Password",
        state: "password",
        component: UpdatePassword,
      },
    ],
  },
  {
    name: "ArgoCD",
    state: "argocd",
    childOptions: [
      {
        name: "ArgoCD URL",
        state: "argocdURL",
        component: UpdateArgoCDUrl,
      },
      {
        name: "Token",
        state: "token",
        component: UpdateToken,
      },
    ],
  },
  {
    name: "Pipeline",
    state: "pipeline",
    childOptions: [
      {
        name: "Observability",
        state: "observability",
        component: UpdatePipelineObservability,
      },
      {
        name: "Deviation Value",
        state: "deviation",
        component: UpdateDeviationValue,
      },
      {
        name: "Message",
        state: "message",
        component: UpdateMessage,
      },
    ],
  },
  {
    name: "Notifications",
    state: "notification",
    childOptions: [
      {
        name: "Slack",
        state: "slack",
        component: ToggleSlackNotification,
      },
      {
        name: "Gmail",
        state: "gmail",
        component: ToggleGmailNotification,
      },
    ],
  },
];

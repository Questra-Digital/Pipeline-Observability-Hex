import ToggleGmailNotification from "@/components/molecules/Settings/ToggleGmailNotification";
import ToggleSlackNotification from "@/components/molecules/Settings/ToggleSlackNotification";
import UpdateCompanyName from "@/components/molecules/Settings/UpdateCompanyName";
import UpdateDeviationValue from "@/components/molecules/Settings/UpdateDeviationValue";
import UpdateEmail from "@/components/molecules/Settings/UpdateEmail";
import UpdatePassword from "@/components/molecules/Settings/UpdatePassword";
import UpdatePipelineObservability from "@/components/molecules/Settings/UpdatePipelineObservability";
import UpdateToken from "@/components/molecules/Settings/UpdateToken";


export const settingsOptions = [
    {
        name: 'General',
        state: 'user',
        childOptions: [
            {
                name: 'Email',
                state: 'email',
                component: UpdateEmail
            },
                // {
                //     name: 'Company Name',
                //     state: 'company',
                //     component: UpdateCompanyName
                // },
            {
                name: 'Password',
                state: 'password',
                component: UpdatePassword
            }
        ]
    },
    {
        name: 'Pipeline',
        state: 'pipeline',
        childOptions: [
            {
                name: 'Observability',
                state: 'observability',
                component: UpdatePipelineObservability
            },
            {
                name: 'Deviation Value',
                state: 'deviation',
                component: UpdateDeviationValue
            },
            {
                name: 'Token',
                state: 'token',
                component: UpdateToken
            }
        ]
    },
    {
        name: 'Notifications',
        state: 'notification',
        childOptions: [
            {
                name: 'Slack',
                state: 'slack',
                component: ToggleSlackNotification
            },
            {
                name: 'Gmail',
                state: 'gmail',
                component: ToggleGmailNotification
            },
        ]
    }

]

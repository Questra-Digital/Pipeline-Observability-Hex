import ToggleGmailNotification from "@/Components/molecules/Settings/ToggleGmailNotification";
import ToggleSlackNotification from "@/Components/molecules/Settings/ToggleSlackNotification";
import UpdateCompanyName from "@/Components/molecules/Settings/UpdateCompanyName";
import UpdateDeviationValue from "@/Components/molecules/Settings/UpdateDeviationValue";
import UpdateEmail from "@/Components/molecules/Settings/UpdateEmail";
import UpdatePassword from "@/Components/molecules/Settings/UpdatePassword";
import UpdatePipelineObservability from "@/Components/molecules/Settings/UpdatePipelineObservability";
import UpdateToken from "@/Components/molecules/Settings/UpdateToken";


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
            {
                name: 'Company Name',
                state: 'company',
                component: UpdateCompanyName
            },
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

import SettingsComponent from "@/Components/molecules/Settings/SettingsComponent";


export const settingsOptions = [
    {
        name: 'General',
        state: 'user',
        childOptions: [
            {
                name: 'Email',
                state: 'email',
                component: SettingsComponent
            },
            {
                name: 'Company Name',
                state: 'company',
                component: SettingsComponent
            },
            {
                name: 'Password',
                state: 'password',
                component: SettingsComponent
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
                component: SettingsComponent
            },
            {
                name: 'Deviation Value',
                state: 'deviation',
                component: SettingsComponent
            },
            {
                name: 'Token',
                state: 'token',
                component: SettingsComponent
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
                component: SettingsComponent
            },
            {
                name: 'Gmail',
                state: 'gmail',
                component: SettingsComponent
            },
        ]
    }

]

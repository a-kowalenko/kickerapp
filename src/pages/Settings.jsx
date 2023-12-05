import Heading from "../ui/Heading";
import SeasonSettings from "../features/settings/SeasonSettings";
import GeneralSettings from "../features/settings/GeneralSettings";
import TabView from "../ui/TabView";

function Settings() {
    const tabs = [
        {
            path: `/settings/general`,
            label: "General",
            component: <GeneralSettings />,
        },
        {
            path: `/settings/season`,
            label: "Season",
            component: <SeasonSettings />,
        },
    ];

    return (
        <>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Settings
            </Heading>
            <TabView tabs={tabs} />
        </>
    );
}

export default Settings;

import {StyleSheet} from "react-native";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

export const BottomTabs = () => {
    return (
        <></>
        // <Tab.Navigator>
        //     <Tab.Screen name={'Feed'} component={NewsFeed}/>
        //     {/*<Tab.Screen name={'Camera'}/>*/}
        //     <Tab.Screen name={'Account'} component={Account}/>
        // </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    barWrapper: {
        flex: 1,
        height: 10,
    },
});

export default BottomTabs;

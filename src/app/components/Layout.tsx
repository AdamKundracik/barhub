import {SafeAreaView, StyleSheet, TouchableOpacity, View} from "react-native";
import {ReactNode} from "react";
import BottomBar from "./BottomBar";

type LayoutProps = {
    children: ReactNode | ReactNode[];
    pageTitle: string;
}

export const Layout = ({ children, pageTitle }: LayoutProps) => {
    // const navigation = useNavigation();

    // const handleNavigateBack = () => {
    //     navigation.dispatch(popAction);
    // };

    return (
        <SafeAreaView style={styles.wrapper}>
            <View>
                {children}
            </View>
            {/*<View style={styles.bottomBar}>*/}
            {/*    <BottomBar/>*/}
            {/*</View>*/}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: 'black'
    },
    content: {
        flex: 1,
    },
    header: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainContent: {
        flex: 1,
    },
    bottomBar: {
        height: 60, // Adjust the height as needed
        justifyContent: 'flex-end',
    },
    backButton: {
        paddingRight: 10,
        justifyContent: 'center',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    }
});

export default Layout;

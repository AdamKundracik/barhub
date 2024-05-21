import {Animated, SafeAreaView, StyleSheet, View} from "react-native";
import {ReactNode} from "react";
import {BottomTabs} from "./BottomTabs";
import ScrollView = Animated.ScrollView;

type LayoutProps = {
    children: ReactNode | ReactNode[];
    pageTitle: string;
};

export const AuthLayout = ({children, pageTitle}: LayoutProps) => {
    return (
        <SafeAreaView style={styles.wrapper}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.mainContent}>{children}</View>
            </ScrollView>
            <View style={styles.bottomBar}>
                <BottomTabs/>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: "black",
    },
    content: {
        flex: 1,
    },
    header: {
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 20
    },
    bottomBar: {
        height: 60, // Adjust the height as needed
        justifyContent: "flex-end",
    },
    backButton: {
        paddingRight: 10,
        justifyContent: "center",
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: "bold",
    },
    scrollView: {
        flexGrow: 1,
    },
});

export default AuthLayout;

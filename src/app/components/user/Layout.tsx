import {Animated, SafeAreaView, StyleSheet, View} from "react-native";
import {ReactNode} from "react";
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: "black",
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 20
    },
    scrollView: {
        flexGrow: 1,
    },
});

export default AuthLayout;

import {SafeAreaView, StyleSheet, View} from "react-native";
import {ReactNode} from "react";


type LayoutProps = {
    children: ReactNode | ReactNode[];
    pageTitle: string;
};

export const Layout = ({children}: LayoutProps) => {
    return (
        <SafeAreaView style={styles.wrapper}>
            <View style={styles.mainContent}>{children}</View>
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
        paddingHorizontal: 5,
        paddingVertical: 20
    },
});

export default Layout;

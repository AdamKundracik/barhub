import {StyleSheet} from "react-native";

export const formStyles = StyleSheet.create({
    inputPrimary: {
        height: 40,
        marginBottom: 12,
        padding: 10,
        backgroundColor: "white",
        borderRadius: 10,
    },

    buttonPrimary: {
        alignItems: "center",
        marginTop: 10,
        borderRadius: 30,
        height: 40,
        alignSelf: "center",
        width: "80%",
        backgroundColor: "white",
    },
    buttonSecondary: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        borderRadius: 30,
        height: 40,
        alignSelf: "center",
        width: "80%",
        backgroundColor: "black",
    },
    buttonPrimaryDisabled: {
        alignItems: "center",
        marginTop: 10,
        borderRadius: 30,
        height: 40,
        alignSelf: "center",
        width: "80%",
        backgroundColor: "#6c6c72",
    },
    buttonTextDisabled: {
        display: "flex",
        margin: "auto",
        fontWeight: "bold",
        fontSize: 20,
        color: "rgb(27,34,40)"
    },
    buttonText: {
        display: "flex",
        margin: "auto",
        fontWeight: "bold",
        fontSize: 20,
    },
});

export const commonAppStyles = StyleSheet.create({
    textPrimary: {
        color: "white",
    },
    textSecondary: {
        color: "black"
    }
});

export const authPageStyles = StyleSheet.create({
    authPageContainer: {
        padding: 10,
        height: "100%",
        justifyContent: "center",
    },
});

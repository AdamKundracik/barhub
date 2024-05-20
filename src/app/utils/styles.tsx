import {StyleSheet} from "react-native";

export const formStyles = StyleSheet.create({
    inputPrimary: {
        height: 40,
        marginBottom: 12,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 10
    },

    buttonPrimary: {
        alignItems: 'center',
        marginTop: 10,
        borderRadius: 30,
        height: 40,
        alignSelf: 'center',
        width: '80%',
        backgroundColor: 'white',
    },
    buttonText: {
        display: 'flex',
        margin: 'auto',
        fontWeight: 'bold',
        fontSize: 20,
    }
})

export const commonAppStyles = StyleSheet.create({
    textPrimary: {
        color: 'white'
    }
})

export const authPageStyles = StyleSheet.create({
    authPageContainer: {
        padding: 10,
        height: '100%',
        justifyContent: "center",
    }
})

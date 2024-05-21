import {Image, StyleSheet, Text, View} from "react-native";
import {commonAppStyles} from "../../utils/styles";

export const UserPost = () => {
    return (
        <View style={styles.postWrapper}>
            <View style={styles.userLine}>
                <View>
                    <Text style={commonAppStyles.textPrimary}>Josh Manony</Text>
                </View>
                <View>
                    <Text style={commonAppStyles.textPrimary}>2 hours</Text>
                </View>
            </View>
            <Image
                style={styles.photo}
                source={{
                    uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=3028&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                }}/>
            <View style={styles.photoActions}>
                <Text>icon</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    postWrapper: {
        width: '100%',
        height: 500,
        backgroundColor: 'white',
    },
    userLine: {
        flex: 1,
        paddingHorizontal: 10,
        backgroundColor: '#424242',
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    photo: {
        flex: 10
    },
    photoActions: {
        flex: 1
    },
})

export default UserPost

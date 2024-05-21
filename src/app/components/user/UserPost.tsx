import {Image, StyleSheet, Text, View} from "react-native";
import {commonAppStyles} from "../../utils/styles";

interface PostInterface {
    link: string
}

export const UserPost = (props: PostInterface) => {
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
                    uri: props.link,
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

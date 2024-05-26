import {Dimensions, StyleSheet, Text, View} from "react-native";
import {commonAppStyles} from "../../utils/styles";
import Animated, {useAnimatedStyle, useSharedValue, withSpring, withTiming} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";

interface PostInterface {
    link: string
}

const {width, height} = Dimensions.get('screen');

export const UserPost = (props: PostInterface) => {
    const scale = useSharedValue(1);
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);

    const pinch = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = event.scale;
            focalX.value = event.focalX;
            focalY.value = event.focalY;
        })
        .onEnd(() => {
            scale.value = withSpring(1);
            scale.value = withTiming(1);
        })
        .runOnJS(true);


    const rStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: focalX.value},
                {translateY: focalY.value},
                {translateX: -width / 2},
                {translateY: -height / 2},
                {scale: scale.value},
                {translateX: -focalX.value},
                {translateY: -focalY.value},
                {translateX: width / 2},
                {translateY: height / 2},
            ],
        };
    });

    const focalPointStyle = useAnimatedStyle(() => {
        return {
            transform: [{translateX: focalX.value}, {translateY: focalY.value}],
        };
    });

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
            <GestureDetector gesture={pinch}>
                <Animated.Image
                    style={[styles.photo, rStyle]}
                    source={{
                        uri: props.link,
                    }}
                />
            </GestureDetector>
            <View style={styles.photoActions}>
                <Text>icon</Text>
            </View>
        </View>
    );
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
        flex: 10,
        width: '100%',
        height: '100%',
    },
    photoActions: {
        flex: 1
    },
    focalPoint: {
        ...StyleSheet.absoluteFillObject,
        width: 20,
        height: 20,
        backgroundColor: 'blue',
        borderRadius: 10,
    },
})

export default UserPost;

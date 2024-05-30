import {Image, StyleSheet, Text, View} from "react-native";
import {commonAppStyles} from "../../utils/styles";
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";

interface PostInterface {
    link: string
    setZoomedPost: (link: string | null) => void;
    isZoomed: boolean;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);


export const UserPost = (props: PostInterface) => {
    const {link, setZoomedPost, isZoomed} = props;
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);
    const xCurrent = useSharedValue(0);
    const yCurrent = useSharedValue(0);
    const scale = useSharedValue(1);

    const pinch = Gesture.Pinch()
        .onStart((g) => {
            if (g.numberOfPointers == 2) {
                focalX.value = g.focalX;
                focalY.value = g.focalY;
            }
            setZoomedPost(link);
        })
        .onUpdate((g) => {
            scale.value = g.scale;
            const dx = g.focalX - focalX.value;
            const dy = g.focalY - focalY.value;
            xCurrent.value = dx * -(1 - g.scale);
            yCurrent.value = dy * -(1 - g.scale);
        })
        .onEnd(() => {
            // Animate values back to original states
            scale.value = withTiming(1);
            xCurrent.value = withTiming(0);
            yCurrent.value = withTiming(0);
            setZoomedPost(null);
        })
        .runOnJS(true);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: xCurrent.value},
                {translateY: yCurrent.value},
                {scale: scale.value},
            ],
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
                    style={[styles.photo, animatedStyle]}
                    source={{
                        uri: link,
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
    focalPoint: {
        ...StyleSheet.absoluteFillObject,
        width: 20,
        height: 20,
        backgroundColor: 'blue',
        borderRadius: 10,
    },
    photo: {
        flex: 10,
        width: '100%',
        height: '100%',
        zIndex: 1000,
    },
    photoActions: {
        flex: 1
    },
})

export default UserPost;

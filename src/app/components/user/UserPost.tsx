import {Dimensions, Image, StyleSheet, Text, View} from "react-native";
import {commonAppStyles} from "../../utils/styles";
import Animated, {useAnimatedStyle, useSharedValue} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";

interface PostInterface {
    link: string
    setZoomedPost: (link: string | null) => void;
    isZoomed: boolean;

}

const {width, height} = Dimensions.get('screen');

const AnimatedImage = Animated.createAnimatedComponent(Image);


export const UserPost = (props: PostInterface) => {
    const {link, setZoomedPost, isZoomed} = props;
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);
    const xCurrent = useSharedValue(0);
    const yCurrent = useSharedValue(0);
    const xPrevious = useSharedValue(0);
    const yPrevious = useSharedValue(0);
    const scaleCurrent = useSharedValue(1);
    const scalePrevious = useSharedValue(1);

    const pinch = Gesture.Pinch()
        .onStart((g) => {
            scaleCurrent.value = g.scale
            if (g.numberOfPointers == 2) {
                focalX.value = g.focalX;
                focalY.value = g.focalY;
            }
            setZoomedPost(link);
        })
        .onUpdate((g) => {
            scaleCurrent.value = g.scale;
            xCurrent.value = (1 - scaleCurrent.value) * (focalX.value - width / 2);
            yCurrent.value = (1 - scaleCurrent.value) * (focalY.value - height / 2);
        })
        .onEnd(() => {
            scalePrevious.value = scalePrevious.value * scaleCurrent.value;

            xPrevious.value = scaleCurrent.value * xPrevious.value + xCurrent.value;
            yPrevious.value = scaleCurrent.value * yPrevious.value + yCurrent.value;
            
            xCurrent.value = 0;
            yCurrent.value = 0;

            scaleCurrent.value = 1;
            setZoomedPost(null);
        })
        .runOnJS(true)


    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: xCurrent.value},
                {translateY: yCurrent.value},
                {scale: scaleCurrent.value},
                {translateX: xPrevious.value},
                {translateY: yPrevious.value},
                {scale: scalePrevious.value},
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
                <AnimatedImage
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

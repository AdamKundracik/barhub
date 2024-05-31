import {Button, Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {useRef, useState} from "react";
import {CameraType, CameraView, FlashMode, useCameraPermissions} from 'expo-camera';
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faCircleCheck} from "@fortawesome/free-regular-svg-icons"
import {commonAppStyles} from "../../utils/styles";

const {width} = Dimensions.get('window')


export const CameraScreen = () => {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [flash, setFlash] = useState<FlashMode>('off');
    const camera = useRef(null);
    const [image, setImage] = useState(null);

    const captureImage = async () => {
        if (permission.granted && camera.current) {
            try {
                const data = await camera.current.takePictureAsync();
                console.log(data);
                setImage(data.uri);
            } catch (error) {
                console.log(error);
            }
        }
    }

    function savePicture() {
        if (image) {
            try {
                alert('Picture saved! 🎉');
                setImage(null);
            } catch (error) {
                console.log(error);
            }
        }
    };


    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }


    if (!permission) {
        return <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text>Permission not granted</Text>
        </View>
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{textAlign: 'center'}}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission"/>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            {!image ?
                <CameraView style={styles.camera} ref={camera} facing={facing} hasTVPreferredFocus={true} flash={flash}>
                    <SafeAreaView
                        style={{backgroundColor: 'black',}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', padding: 10}}>
                            <TouchableOpacity
                                onPress={() =>
                                    setFlash(flash === 'off' ? 'on' : 'off')}
                            >
                                <FontAwesomeIcon icon={faCircleCheck} size={24}
                                                 color={flash === 'on' ? 'white' : 'grey'}/>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleCameraFacing}>
                                <Text style={commonAppStyles.textPrimary}>Flip Camera</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={captureImage}>
                            <View style={styles.shotButton}></View>
                        </TouchableOpacity>
                    </View>
                </CameraView>
                :
                <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
                    <View style={styles.container}>
                        <Image source={{uri: image}} style={styles.image}/>
                        <View style={styles.overlay}>
                            <View>
                                <TouchableOpacity style={styles.button} onPress={() => setImage(null)}>
                                    <Text style={[commonAppStyles.textPrimary, {
                                        fontWeight: 'bold',
                                        fontSize: 24
                                    }]}>Retake</Text>
                                </TouchableOpacity>
                            </View>
                            <View>
                                <TouchableOpacity style={styles.button}>
                                    <Text style={[commonAppStyles.textPrimary, {
                                        fontWeight: 'bold',
                                        fontSize: 24
                                    }]}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    shotButton: {
        height: 80,
        width: 80,
        backgroundColor: 'white',
        borderRadius: 50
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: "space-evenly",
        position: 'absolute',
        bottom: 40,
        flex: 1,
        alignItems: 'center',
    },
});
export default CameraScreen;

import React, {useState} from "react";
import * as ImagePicker from 'expo-image-picker';
import Layout from "../../components/user/Layout";
import {Image, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View} from "react-native";
import {faSquarePlus} from "@fortawesome/free-regular-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {formStyles} from "../../utils/styles/styles";
import {useTranslation} from "react-i18next";


export const SetUpProfile = () => {
    const {t} = useTranslation();
    const [image, setImage] = useState<string | null>(null);
    const [name, setName] = useState('')

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };


    return (
        <Layout pageTitle={'Set up profile'}>
            <View style={{flex: 1}}>
                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}>
                    <View style={styles.container}>
                        {image ? (
                            <TouchableOpacity style={styles.profilePicture} onPress={pickImage}>
                                <Image source={{uri: image}}/>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.addProfilePicture} onPress={pickImage}>
                                <View>
                                    <FontAwesomeIcon icon={faSquarePlus} color={"white"} size={30}/>
                                </View>
                            </TouchableOpacity>
                        )}

                    </View>
                    <InputWrapper inputLabel={'Name'}>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={formStyles.inputPrimary}
                            placeholder={t('name')}
                            keyboardType={"default"}
                        />
                    </InputWrapper>
                </KeyboardAvoidingView>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    profilePicture: {
        width: 150,
        height: 150,
        borderRadius: 100,
        marginBottom: 20,
    },
    content: {
        flex: 1,
    },
    addProfilePicture: {
        width: 150,
        height: 150,
        borderRadius: 100,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'grey',
        backgroundColor: 'rgb(65,65,65)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
});

export default SetUpProfile;

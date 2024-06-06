import React, {useState} from "react";
import * as ImagePicker from 'expo-image-picker';
import Layout from "../../components/user/Layout";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faPlusSquare} from "@fortawesome/free-regular-svg-icons";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {t} from "i18next";
import {commonAppStyles, formStyles} from "../../utils/styles/styles";
import DatePicker from "expo-datepicker";
import {getAge} from "../../utils/helper-functions/getAge";
import {setUser} from "../../utils/services/functions";
import {createDateFromCustomString} from "../../utils/helper-functions/createDateFromString";
import {updateProfile} from "firebase/auth";
import {auth} from "../../../../firebaseConfig";
import {useAuthReload} from "@react-query-firebase/auth";


export const SetUpProfile = () => {
    const [image, setImage] = useState<string | null>(null);
    const [username, setUserName] = useState('')
    const [date, setDate] = useState(new Date().toISOString());
    const [uploading, setUploading] = useState(false);

    const mutation = useAuthReload();

    function reloadUser() {
        mutation.mutate(auth.currentUser!);
    }


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

    function isFormValid(): boolean {
        const age = getAge(date)
        return age > 16 && !!image && !!username
    };

    async function submitForm() {
        setUploading(true);
        const dateOfBirth = createDateFromCustomString(date);
        await setUser({
            photoURL: image,
            displayName: username,
            dateOfBirth: dateOfBirth
        });
        updateProfile(auth.currentUser!, {
            displayName: username,
            photoURL: image
        }).then(async () => {
            setUploading(false);
            reloadUser();
        });
    };

    return (
        <Layout pageTitle={'Set up profile'}>
            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}>
                <View style={styles.container}>
                    <View style={{marginBottom: 30}}>
                        <Text style={[commonAppStyles.textPrimary, {fontSize: 30}]}>Set up your profile</Text>
                    </View>
                    {image ? (
                        <TouchableOpacity onPress={pickImage}>
                            <Image source={{uri: image}} style={styles.profilePicture}/>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={pickImage}>
                            <View style={styles.addProfilePicture}>
                                <FontAwesomeIcon icon={faPlusSquare} color={"white"} size={30}/>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
                <InputWrapper inputLabel={t('user-name')}>
                    <TextInput
                        value={username}
                        onChangeText={setUserName}
                        style={formStyles.inputPrimary}
                        placeholder={t('user-name')}
                        keyboardType={"default"}
                    />
                </InputWrapper>
                <InputWrapper inputLabel={t('date-of-birth')}>
                    <DatePicker date={date}
                                onChange={(date) => setDate(date)}
                                selectedColor={'grey'}
                                fontStyle={{color: 'white'}}
                                backgroundColor={'black'}
                                inputYearStyle={{backgroundColor: 'white'}}
                    />
                </InputWrapper>
                <TouchableOpacity
                    onPress={submitForm}
                    style={!isFormValid() ? formStyles.buttonPrimaryDisabled : formStyles.buttonPrimary}
                    disabled={!isFormValid()}
                >
                    {uploading ? <ActivityIndicator style={formStyles.buttonText} size='small' color='#000000'/> :
                        <Text style={formStyles.buttonText}>{t('submit')}</Text>}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Layout>
    );
};

const styles = StyleSheet.create({
    profilePicture: {
        width: 150,
        height: 150,
        borderRadius: 50,
        marginBottom: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center'
    },
    addProfilePicture: {
        width: 150,
        height: 150,
        borderRadius: 50,
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
    },
});

export default SetUpProfile;

import { Dimensions, StyleSheet, Text, View } from 'react-native';
import {
  iconInactiveColor,
  primaryBgColor,
  warningColor,
} from '../../../../utils/styles/colors';
import Svg, { Path } from 'react-native-svg';
import Button from '../../../shared/Button';
import { openCamera } from '../../../../utils/helper-functions/openCamera';
import { auth } from '../../../../../../firebaseConfig';
import { BlurView } from 'expo-blur';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';

const width = Dimensions.get('window').width;

export const BluredPostFrontView = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();

  return (
    <BlurView intensity={20} style={styles.blurView}>
      <View style={styles.container}>
        <View style={styles.svgContainer}>
          <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <Path
              d="M20 40C16.0444 40 12.1776 38.827 8.8886 36.6294C5.59962 34.4318 3.03617 31.3082 1.52242 27.6537C0.00866568 23.9991 -0.387401 19.9778 0.384303 16.0982C1.15601 12.2186 3.06082 8.65492 5.85787 5.85787C8.65492 3.06082 12.2186 1.15601 16.0982 0.384303C19.9778 -0.387401 23.9991 0.00866568 27.6537 1.52242C31.3082 3.03617 34.4318 5.59962 36.6294 8.8886C38.827 12.1776 40 16.0444 40 20C40 25.3043 37.8929 30.3914 34.1421 34.1421C30.3914 37.8929 25.3043 40 20 40ZM20 2.85715C16.6095 2.85715 13.2951 3.86256 10.4759 5.74624C7.65682 7.62992 5.45958 10.3073 4.16207 13.4397C2.86457 16.5722 2.52509 20.019 3.18655 23.3444C3.84801 26.6698 5.48071 29.7244 7.87818 32.1218C10.2756 34.5193 13.3302 36.152 16.6556 36.8135C19.981 37.4749 23.4278 37.1354 26.5603 35.8379C29.6927 34.5404 32.3701 32.3432 34.2538 29.5241C36.1374 26.7049 37.1429 23.3905 37.1429 20C37.1429 15.4534 35.3367 11.0931 32.1218 7.87818C28.9069 4.66327 24.5466 2.85715 20 2.85715ZM22.1429 9.28572C22.1429 9.70954 22.0172 10.1238 21.7817 10.4762C21.5463 10.8286 21.2116 11.1033 20.82 11.2655C20.4285 11.4277 19.9976 11.4701 19.582 11.3874C19.1663 11.3047 18.7845 11.1006 18.4848 10.801C18.1851 10.5013 17.981 10.1194 17.8983 9.70377C17.8156 9.2881 17.8581 8.85724 18.0203 8.46568C18.1825 8.07413 18.4571 7.73946 18.8095 7.504C19.1619 7.26854 19.5762 7.14286 20 7.14286C20.5683 7.14286 21.1134 7.36863 21.5152 7.77049C21.9171 8.17236 22.1429 8.7174 22.1429 9.28572ZM20 14.2857C19.6211 14.2857 19.2578 14.4362 18.9899 14.7041C18.7219 14.972 18.5714 15.3354 18.5714 15.7143V31.4286C18.5714 31.8075 18.7219 32.1708 18.9899 32.4387C19.2578 32.7066 19.6211 32.8571 20 32.8571C20.3789 32.8571 20.7422 32.7066 21.0102 32.4387C21.2781 32.1708 21.4286 31.8075 21.4286 31.4286V15.7143C21.4286 15.3354 21.2781 14.972 21.0102 14.7041C20.7422 14.4362 20.3789 14.2857 20 14.2857Z"
              fill={warningColor}
            />
          </Svg>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>{t('no-acitivity')}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            color={warningColor}
            text={t('take-photo')}
            clickFuntion={async () => {
              await openCamera(null, auth.currentUser?.uid, navigation);
            }}
          />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoText}>{t('no-acitivity-info')}</Text>
        </View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurView: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    height: width * 0.6,
    backgroundColor: primaryBgColor,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: warningColor,
    padding: 20,
    gap: 20,
  },
  svgContainer: {
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  infoTextContainer: {
    alignItems: 'center',
  },
  mainText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  infoText: {
    color: iconInactiveColor,
  },
});

export default BluredPostFrontView;

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import * as MailComposer from 'expo-mail-composer';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '@/firebaseConfig';
import {
  bottomModalBgColor,
  warningColor,
} from '@/src/app/utils/styles/colors';
import { useNotificationsHandler } from '@/src/app/components/user/NewsFeed/NotificationHandler';

type BottomSheetMenuProps = {
  visible: boolean;
  setVisible: (isOpen: boolean) => void;
};

const RollupMenu = ({ visible, setVisible }: BottomSheetMenuProps) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { unsubscribeNotifications } = useNotificationsHandler();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleSignOut = async () => {
    await unsubscribeNotifications();
    await signOut(auth)
      .then(() => Alert.alert(t('signed-out'), t('you-have-been-signed-out')))
      .catch(console.error);
  };

  // nová funkcia pre Help
  const handleHelpMail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(t('error'), t('mailer-not-available'));
      return;
    }

    await MailComposer.composeAsync({
      recipients: ['support@example.com'], // zmeniť na tvoj support e-mail
      subject: t('help-request'),
      body: t('please-describe-your-issue'),
    });
  };

  const menuItems = [
    {
      title: t('account'),
      icon: Icons.User,
      action: () => navigation.navigate('Account'),
    },
    {
      title: t('info'),
      icon: Icons.Info,
      action: () => navigation.navigate('Info'),
    },
    {
      title: t('help'),
      icon: Icons.Help,
      action: handleHelpMail,
    },
    {
      title: t('logout'),
      icon: Icons.LogOut,
      action: () => handleSignOut(),
    },
  ];

  const [contentHeight, setContentHeight] = useState(0);

  const snapPoints = useMemo(
    () => (contentHeight ? [contentHeight] : ['50%']),
    [contentHeight]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height + 90 + insets.bottom + 20);
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const menuItemAnims = useRef(
    menuItems.map(() => new Animated.Value(0))
  ).current;

  const handlePresent = useCallback(() => {
    bottomSheetRef.current?.present();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    menuItemAnims.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: idx * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleClose = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    menuItemAnims.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        delay: idx * 50,
        useNativeDriver: true,
      }).start();
    });

    bottomSheetRef.current?.dismiss();
  }, []);

  useEffect(() => {
    if (visible) handlePresent();
    else handleClose();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom + 20}>
        {/* Cancel button */}
        <View style={styles.cancelContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ),
    []
  );

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={() => setVisible(false)}
        backgroundStyle={styles.container}
        handleIndicatorStyle={styles.handleIndicator}
        footerComponent={renderFooter}
      >
        <BottomSheetView style={styles.content} onLayout={handleLayout}>
          {menuItems
            .filter(item => item.title !== t('logout'))
            .map((item, idx) => (
              <Animated.View
                key={idx}
                style={{
                  opacity: menuItemAnims[idx],
                  transform: [
                    {
                      translateY: menuItemAnims[idx].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={styles.itemWrapper}
                  activeOpacity={0.7}
                  onPress={() => {
                    item.action();
                    handleClose();
                  }}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    size={20}
                    color="#fff"
                    style={{ marginRight: 12 }}
                  />
                  <Text style={styles.buttonText}>{item.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}

          {/* Logout button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              const logoutItem = menuItems.find(
                item => item.title === t('logout')
              );
              logoutItem?.action();
              handleClose();
            }}
          >
            <Text style={styles.logoutButtonText}>{t('logout')}</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: bottomModalBgColor,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
  },
  handleIndicator: {
    backgroundColor: '#444',
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  content: {
    width: '100%',
    paddingHorizontal: 20,
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: warningColor,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#222',
    paddingVertical: 14,
  },
  cancelContainer: {},
});

export default RollupMenu;

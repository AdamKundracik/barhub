import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../utils/types/screen-types';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { formStyles } from '@/src/app/utils/styles/styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomSheetMenuProps = {
  visible: boolean;
  setVisible: (isOpen: boolean) => void;
};

const RollupMenu = ({ visible, setVisible }: BottomSheetMenuProps) => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const menuItems = [
    {
      title: t('account'),
      icon: Icons.Gear,
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
      action: () => navigation.navigate('Help'),
    },
    { title: t('logout'), icon: Icons.LogOut, action: () => handleSignOut() },
  ];

  const [contentHeight, setContentHeight] = useState(0);

  const snapPoints = useMemo(
    () => (contentHeight ? [contentHeight] : ['50%']),
    [contentHeight]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height + 90 + insets.bottom + 20); // optional extra padding
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

  const handleSignOut = () => {
    signOut(auth)
      .then(() => alert(t('Signed out')))
      .catch(console.error);
  };

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
      <BottomSheetFooter
        {...props}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        bottomInset={insets.bottom + 20}
      >
        {/* Cancel button */}
        <TouchableOpacity
          style={formStyles.buttonSecondary}
          onPress={handleClose}
        >
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </TouchableOpacity>
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
                  width: '100%',
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
                  style={styles.button}
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
            style={[formStyles.buttonSecondary, styles.logoutButton]}
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  handleIndicator: {
    backgroundColor: '#fff',
    width: '10%',
    marginBottom: 10,
  },
  content: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderColor: '#ff3535',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: '#ff3535',
    fontWeight: '600',
  },
});

export default RollupMenu;

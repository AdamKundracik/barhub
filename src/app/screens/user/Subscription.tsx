import {
  Animated,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useRevenueCat } from '../../providers/RevenueCatProvider';
import { PurchasesPackage } from 'react-native-purchases';
import { UserStackList } from '../../utils/types/screen-types';
import Layout from '../../components/user/Layout';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';

export const Subscription = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { currentUser, packages, purchasePackage, restorePermissions } =
    useRevenueCat();
  const [animationValues, setAnimationValues] = useState(
    packages.map(() => new Animated.Value(1))
  );

  const onPurchase = async (pack: PurchasesPackage) => {
    // Purchase the package
    await purchasePackage!(pack);
  };

  useEffect(() => {
    // Example of fade-in animation when the component mounts
    Animated.stagger(
      100,
      packages.map((_, index) =>
        Animated.timing(animationValues[index], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  const handlePressIn = (index: number) => {
    Animated.spring(animationValues[index], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(animationValues[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Layout pageTitle={'Subscription'}>
      <Text
        style={{
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: 24,
        }}
      >
        Subscription plans
      </Text>
      <ScrollView>
        {/* Display the packages */}
        <View style={styles.container}>
          {packages.map((pack, index) => (
            <Animated.View
              key={pack.identifier}
              style={[
                styles.button,
                { transform: [{ scale: animationValues[index] }] },
              ]}
            >
              <TouchableOpacity
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                onPress={() => onPurchase(pack)}
                style={styles.touchable}
              >
                <View style={styles.icon}>
                  <FontAwesomeIcon
                    icon={Icons.BoxPacking}
                    size={24}
                    color="#EA3C4A"
                  />
                </View>
                <View style={styles.text}>
                  <Text style={styles.title}>{pack.product.title}</Text>
                  <Text style={styles.desc}>{pack.product.description}</Text>
                </View>
                <View style={styles.price}>
                  <Text style={styles.priceText}>
                    {pack.product.priceString}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        <Button onPress={restorePermissions} title="Restore"></Button>

        {/* Display the user state */}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    margin: 8,
    width: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  touchable: {
    flexDirection: 'row',
    width: '100%',
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  text: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  desc: {
    color: '#B6B7C0',
    paddingVertical: 4,
    fontSize: 14,
  },
  price: {
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    borderColor: '#EA3C4A',
    backgroundColor: '#FDECEC',
  },
  priceText: {
    color: '#EA3C4A',
    fontWeight: 'bold',
  },
});

export default Subscription;

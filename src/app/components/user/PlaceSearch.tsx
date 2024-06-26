import Layout from './Layout';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { formStyles } from '../../utils/styles/styles';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { fetchPlaceAutocomplete } from '../../utils/helper-functions/fetchPlacesAutocomplete';
import { useAuthContext } from '../../providers/AuthProvider';

type LayoutProps = {
  setSearching: (isSearching: boolean) => void;
};

export const PlaceSearch = (props: LayoutProps) => {
  // const [searchText, setSearchText] = useState<string>('');
  const { location } = useAuthContext();

  function onCancelClick() {
    props.setSearching(false);
  }

  async function getAutocompletePlaces(searchText: string) {
    const places = await fetchPlaceAutocomplete(searchText, location!);
    console.log(places);
  }

  return (
    <Layout pageTitle="Search places">
      <View>
        <TouchableOpacity onPress={onCancelClick}>
          <FontAwesomeIcon icon={Icons.Cancel} size={24} color={'white'} />
        </TouchableOpacity>
        <TextInput
          style={formStyles.inputPrimary}
          onChangeText={text => getAutocompletePlaces(text)}
        />
      </View>
    </Layout>
  );
};

export default PlaceSearch;

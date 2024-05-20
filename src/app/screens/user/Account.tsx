import {Text, View} from "react-native";
import Layout from "../../components/user/Layout";
import {commonAppStyles} from "../../utils/styles";

export const Account = () => {
    return (<Layout pageTitle={'Account'}>
            <View>
                <Text style={commonAppStyles.textPrimary}>Hello wrld</Text>
            </View>
        </Layout>

    );
};

export default Account;

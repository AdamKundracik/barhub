import {NativeStackScreenProps} from "@react-navigation/native-stack";

export type UserStackList = {

    Feed: undefined;

    Account: undefined;

};

export type FeedsScreenProps = NativeStackScreenProps<

    UserStackList, "Account"

>;

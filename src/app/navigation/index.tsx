import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import {useAuthContext} from "../providers/AuthProvider";
import {Loading} from "../screens/Loading";
import AuthNav from "./AuthNav";
import UserNav from "./UserNav";


export const Navigation = () => {
  const { authUser, isLoadingAuth } = useAuthContext();

  if (isLoadingAuth) {
    return <Loading/>
  }

  return (
    <NavigationContainer>
      {!authUser && <AuthNav/>}
      {authUser && <UserNav/>}
    </NavigationContainer>
  );
};

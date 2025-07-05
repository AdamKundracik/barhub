import React, { createContext, useContext } from 'react';
import { usePermissions } from '../utils/hooks/usePermissions';

type PermissionsContextType = ReturnType<typeof usePermissions>;

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const permissionsData = usePermissions();

  return (
    <PermissionsContext.Provider value={permissionsData}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error(
      'usePermissionsContext must be used within a PermissionsProvider'
    );
  }
  return context;
};

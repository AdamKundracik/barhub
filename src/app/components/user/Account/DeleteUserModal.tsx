import React, { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Modal } from '../../shared/Modal';
import { commonAppStyles, formStyles } from '../../../utils/styles/styles';
import { useTranslation } from 'react-i18next';
import { auth } from '../../../../../firebaseConfig';

type DeleteUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteUserModal = memo(
  ({ isOpen, onClose }: DeleteUserModalProps) => {
    const [togglePassword, setTogglePassword] = useState(true);
    const { t } = useTranslation();
    const [password, setPassword] = useState<string>('');

    const handleDeleteUser = async () => {
      await auth.currentUser!.delete();
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true}>
        <View style={styles.modalContent}>
          <Text style={{ fontWeight: 'bold', fontSize: 18 }}>
            Do you really want to delete your account?
          </Text>
          <TouchableOpacity
            style={formStyles.buttonSecondary}
            onPress={() => handleDeleteUser()}
          >
            <Text style={commonAppStyles.textPrimary}>{t('Confirm')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  modalContent: {
    width: 'auto', // Ensures the content takes full width of the modal
    padding: 10, // Padding for the modal content
  },
  textInput: {
    flex: 1, // Ensures the TextInput takes up the full width within its container
  },
});

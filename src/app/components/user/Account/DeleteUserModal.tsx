import React, { memo } from 'react';
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
    const { t } = useTranslation();

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
    width: 'auto',
    padding: 10,
  },
  textInput: {
    flex: 1,
  },
});

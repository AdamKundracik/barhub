import React, { useState } from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/modal';
import { Button, ButtonText } from '@/components/ui/button';
import { CircleIcon, CloseIcon, Icon } from '@/components/ui/icon';
import { Heading } from '@/components/ui/heading';
import { postBgColor, primaryTextColor } from '@/src/app/utils/styles/colors';
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from '@/components/ui/radio';

import { useTranslation } from 'react-i18next';
import { ReportReason } from '@/src/app/utils/types/Feed/PostTypes';

interface ModalProps {
  isOpened: boolean;
  onClose: () => void;
  onSave: (reason: ReportReason) => void;
}

export const PostReportModal = (props: ModalProps) => {
  const { isOpened, onClose, onSave } = props;
  const [reason, setReason] = useState<ReportReason>(ReportReason.SPAM);
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpened} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent
        style={{
          backgroundColor: postBgColor,
          borderColor: 'white',
        }}
      >
        <ModalHeader>
          <Heading size="2xl" style={{ color: primaryTextColor }}>
            {t('reportPost.title')}
          </Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} style={{ color: primaryTextColor }} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <Heading
            size={'md'}
            style={{ color: primaryTextColor, marginBottom: 12 }}
          >
            {t('reportPost.chooseReason')}
          </Heading>

          <RadioGroup
            style={{ marginVertical: 15 }}
            value={reason}
            onChange={val => setReason(val as ReportReason)}
          >
            <Radio value={ReportReason.SPAM} size="lg">
              <RadioIndicator>
                <RadioIcon as={CircleIcon} color={'white'} />
              </RadioIndicator>
              <RadioLabel style={{ color: primaryTextColor }}>
                {t('reportPost.spam')}
              </RadioLabel>
            </Radio>

            <Radio value={ReportReason.INAPPROPRIATE} size="lg">
              <RadioIndicator>
                <RadioIcon as={CircleIcon} color={'white'} />
              </RadioIndicator>
              <RadioLabel style={{ color: primaryTextColor }}>
                {t('reportPost.inappropriate')}
              </RadioLabel>
            </Radio>

            <Radio value={ReportReason.HARASSMENT} size="lg">
              <RadioIndicator>
                <RadioIcon as={CircleIcon} color={'white'} />
              </RadioIndicator>
              <RadioLabel style={{ color: primaryTextColor }}>
                {t('reportPost.harassment')}
              </RadioLabel>
            </Radio>

            <Radio value={ReportReason.OTHER} size="lg">
              <RadioIndicator>
                <RadioIcon as={CircleIcon} color={'white'} />
              </RadioIndicator>
              <RadioLabel style={{ color: primaryTextColor }}>
                {t('reportPost.other')}
              </RadioLabel>
            </Radio>
          </RadioGroup>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            action="secondary"
            className="mr-3"
            onPress={onClose}
          >
            <ButtonText style={{ color: primaryTextColor }}>
              {t('cancel')}
            </ButtonText>
          </Button>
          <Button action="negative" onPress={() => onSave(reason)}>
            <ButtonText style={{ color: primaryTextColor }}>
              {t('reportPost.submit')}
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

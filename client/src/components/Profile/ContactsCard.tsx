import React, { useEffect, useMemo, useState } from 'react';
import { List, theme, Typography } from 'antd';
import ContactsOutlined from '@ant-design/icons/ContactsOutlined';
import isEqual from 'lodash/isEqual';
import { UpdateProfileInfoDto } from 'api';
import { Contacts } from '@common/models/profile';
import { NotificationChannel } from 'modules/Notifications/services/notifications';
import { EmailConfirmation } from './EmailConfirmation';
import CommonCardWithSettingsModal from './CommonCardWithSettingsModal';
import { Contact, ContactsKeys } from 'services/user';
import ContactsCardForm from './ContactsCardForm';
import { epamEmailPattern } from 'services/validators';

const { Paragraph, Text } = Typography;

type ConnectionValue = {
  value: string;
  enabled: boolean;
  lastLinkSentAt?: string;
};

type Connections = Partial<Record<NotificationChannel, ConnectionValue | undefined>>;

type Props = {
  data: Contacts;
  isEditingModeEnabled: boolean;
  connections: Connections;
  sendConfirmationEmail: () => void;
  updateProfile: (data: UpdateProfileInfoDto) => Promise<boolean>;
};

const ContactsCard = ({ connections, data, isEditingModeEnabled, sendConfirmationEmail, updateProfile }: Props) => {
  const [displayValues, setDisplayValues] = useState(data);
  const [values, setValues] = useState(displayValues);
  const [hasError, setHasError] = useState(false);
  const { email, epamEmail, telegram, phone, skype, notes, linkedIn, whatsApp } = displayValues;
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);

  const contacts: Contact[] = useMemo(
    () => [
      {
        name: 'EPAM E-mail',
        value: epamEmail,
        key: ContactsKeys.EpamEmail,
        rules: [{ pattern: epamEmailPattern, message: 'Please enter valid Epam email' }],
      },
      {
        name: 'E-mail',
        value: email,
        key: ContactsKeys.Email,
        rules: [{ type: 'email', message: 'Email is not valid' }],
      },
      {
        name: 'Telegram',
        value: telegram,
        key: ContactsKeys.Telegram,
      },
      {
        name: 'Phone',
        value: phone,
        key: ContactsKeys.Phone,
      },
      {
        name: 'Skype',
        value: skype,
        key: ContactsKeys.Skype,
      },
      {
        name: 'WhatsApp',
        value: whatsApp,
        key: ContactsKeys.WhatsApp,
      },
      {
        name: 'Notes',
        value: notes,
        key: ContactsKeys.Notes,
      },
      {
        name: 'LinkedIn',
        value: linkedIn,
        key: ContactsKeys.LinkedIn,
      },
    ],
    [displayValues],
  );

  const filledContacts = contacts.filter(({ value }: Contact) => value);

  const handleSave = async () => {
    const { email, epamEmail, telegram, phone, skype, notes, linkedIn, whatsApp } = values;
    const updatedContacts: UpdateProfileInfoDto = {
      contactsEpamEmail: epamEmail,
      contactsEmail: email,
      contactsTelegram: telegram,
      contactsPhone: phone,
      contactsSkype: skype,
      contactsNotes: notes,
      contactsLinkedIn: linkedIn,
      contactsWhatsApp: whatsApp,
    };

    const isUpdated = await updateProfile(updatedContacts);

    if (!isUpdated) {
      return;
    }

    setDisplayValues(values);
  };

  const handleCancel = () => {
    setValues(displayValues);
    setHasError(false);
  };

  const content = filledContacts.length ? (
    <List
      itemLayout="horizontal"
      dataSource={filledContacts}
      renderItem={({ name, value, key }: Contact) => (
        <List.Item>
          <Text strong>{name}:</Text>{' '}
          {key !== ContactsKeys.LinkedIn ? (
            <>
              {value}
              {key === ContactsKeys.Email &&
              (!connections.email || !connections.email.enabled) &&
              isEditingModeEnabled ? (
                <EmailConfirmation connection={connections.email} sendConfirmationEmail={sendConfirmationEmail} />
              ) : null}
            </>
          ) : value ? (
            <a target="__blank" href={value}>
              {value}
            </a>
          ) : null}
        </List.Item>
      )}
    />
  ) : null;

  useEffect(() => {
    const readyToUpdate = !isEqual(displayValues, values) && !hasError;
    setIsSaveDisabled(!readyToUpdate);
  }, [hasError, values, displayValues]);

  const { token } = theme.useToken();

  const noDataDescriptionWithNote: JSX.Element = (
    <Paragraph style={{ color: token.colorTextDisabled }}>
      Contacts aren't filled in.
      <br />
      <br />
      <Text strong type="secondary">
        Your contact information will only be visible to course coordinators, RS School admins, and the mentor assigned
        to you.
      </Text>
      <br />
      Please make sure to provide at least one reliable way to contact you.
      <br />
      <Text strong type="secondary">
        Telegram is preferred.
      </Text>
    </Paragraph>
  );

  return (
    <CommonCardWithSettingsModal
      title="Contacts"
      icon={<ContactsOutlined />}
      content={content}
      noDataDescription={noDataDescriptionWithNote}
      isEditingModeEnabled={isEditingModeEnabled}
      saveProfile={handleSave}
      cancelChanges={handleCancel}
      isSaveDisabled={isSaveDisabled}
      profileSettingsContent={<ContactsCardForm contacts={contacts} setValues={setValues} setHasError={setHasError} />}
    />
  );
};

export default ContactsCard;

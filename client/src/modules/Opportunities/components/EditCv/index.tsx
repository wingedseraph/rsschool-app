import { createRef, RefObject, useState } from 'react';
import { Alert, Button, Col, Layout, Row, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { FormInstance } from 'antd/lib/form';
import { FormDataDto, OpportunitiesApi, ResumeCourseDto } from 'api';
import { LoadingScreen } from 'components/LoadingScreen';
import { ContactsForm } from './ContactsForm';
import { GeneralInfoForm } from './GeneralInfoForm';
import { VisibleCoursesForm } from './VisibleCoursesForm';
import {
  AllDataToSubmit,
  AllUserCVData,
  Contacts,
  UserData,
  UserDataToSubmit,
  VisibleCourses,
  VisibleCoursesFormData,
} from 'modules/Opportunities/models';
import { splitDataForForms, transformFieldsData } from 'modules/Opportunities/transformers';
import { useMessage } from 'hooks';

const { Content } = Layout;

type Props = {
  githubId: string;
  contacts: Contacts | null;
  userData: UserData | null;
  visibleCourses: number[];
  courses: ResumeCourseDto[] | null;
  switchView: () => void;
  onUpdateResume?: () => void;
};

const service = new OpportunitiesApi();

const buttonStyle = { width: 'fit-content', margin: '5px' };

export const EditCV = (props: Props) => {
  const { notification } = useMessage();
  const [loading, setLoading] = useState<boolean>(false);
  const [contacts, setContacts] = useState<Contacts | null>(props.contacts);
  const [userData, setUserData] = useState<UserData | null>(props.userData);
  const [visibleCourses, setVisibleCourses] = useState<number[] | null>(props.visibleCourses);
  const [validationFailed, setValidationFailed] = useState<boolean>(false);

  const userFormRef: RefObject<FormInstance> = createRef();
  const contactsFormRef: RefObject<FormInstance> = createRef();
  const visibleCoursesFormRef: RefObject<FormInstance> = createRef();

  const submitData = async (data: AllUserCVData) => {
    const newData = await service.saveResume(props.githubId, data as FormDataDto);

    const { userData, contacts, visibleCourses } = splitDataForForms(newData.data as AllUserCVData);

    setUserData(userData);
    setContacts(contacts);
    setVisibleCourses(visibleCourses);

    props.onUpdateResume?.();
  };

  const saveData = async (data: AllDataToSubmit) => {
    const dataToSubmit = transformFieldsData(data);
    await submitData(dataToSubmit);
  };

  const hasInvalidFields = (form: FormInstance | null) =>
    !form ? false : form.getFieldsError().some(field => field.errors.length);

  const getDataFromForms = () => {
    const userFormData: UserDataToSubmit = userFormRef.current?.getFieldsValue();
    const contactsFormData: Contacts = contactsFormRef.current?.getFieldsValue();
    const visibleCoursesFormData: VisibleCoursesFormData = visibleCoursesFormRef.current?.getFieldsValue() ?? {};

    const visibleCourses = Object.entries(visibleCoursesFormData).reduce<VisibleCourses>((acc, [id, isVisible]) => {
      if (isVisible) acc.push(Number(id));
      return acc;
    }, []);

    return {
      ...userFormData,
      ...contactsFormData,
      visibleCourses,
    };
  };

  const handleSave = async () => {
    if (hasInvalidFields(userFormRef.current) || hasInvalidFields(contactsFormRef.current)) {
      setValidationFailed(true);
      setTimeout(() => setValidationFailed(false), 2000);
      return;
    }

    const values = getDataFromForms();

    setLoading(true);

    await saveData(values);

    setLoading(false);

    notification.success({ message: 'CV successfully updated', duration: 2 });
  };

  return (
    <LoadingScreen show={loading}>
      <Content>
        <Space
          direction="horizontal"
          align="start"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          <Col
            style={{
              margin: '10px auto',
              maxWidth: '960px',
            }}
          >
            <Row justify="center" style={{ marginBottom: '15px' }}>
              <Button
                style={{
                  ...buttonStyle,
                  backgroundColor: '#52C41A',
                  borderColor: '#52C41A',
                }}
                type="primary"
                color="green"
                htmlType="button"
                onClick={handleSave}
                icon={<SaveOutlined />}
              >
                Save CV
              </Button>
              <Button style={buttonStyle} type="default" htmlType="button" onClick={() => props.switchView()}>
                Cancel
              </Button>
            </Row>
            <Row>
              {validationFailed ? (
                <Alert
                  style={{ marginBottom: '10px', width: '100%' }}
                  showIcon
                  type="error"
                  message="All required fields must be filled first"
                />
              ) : null}
            </Row>
            <Row>{userData && <GeneralInfoForm ref={userFormRef} userData={userData} />}</Row>
            <Row>{contacts && <ContactsForm ref={contactsFormRef} contactsList={contacts} />}</Row>
            <Row>
              {visibleCourses && (
                <VisibleCoursesForm
                  ref={visibleCoursesFormRef}
                  courses={props.courses}
                  visibleCourses={visibleCourses}
                />
              )}
            </Row>
          </Col>
        </Space>
      </Content>
    </LoadingScreen>
  );
};

import { Alert, Button, Col, Divider, Form, notification, Row, Spin, Typography } from 'antd';
import { Comment } from '@ant-design/compatible';
import PreparedComment, { markdownLabel } from 'components/Forms/PreparedComment';
import { ScoreIcon } from 'components/Icons/ScoreIcon';
import { SolutionReviewSettings } from 'modules/CrossCheck/constants';
import { useEffect, useMemo, useState } from 'react';
import { CourseService } from 'services/course';
import { formatDateTime } from 'services/formatter';
import { CrossCheckCriteriaModal } from '../criteria/CrossCheckCriteriaModal';
import { StudentDiscord } from '../../../../components/StudentDiscord';
import { getAmountUnreadMessages, getHowManyUnreadMessagesText } from './helpers';
import { Message } from './Message';
import { MessageSendingPanel } from './MessageSendingPanel';
import { UserAvatar } from './UserAvatar';
import { Username } from './Username';
import { CrossCheckCriteriaDataDto, CrossCheckMessageDtoRoleEnum, CrossCheckSolutionReviewDto } from 'api';
import { useMessage } from 'hooks';

const { Text } = Typography;

export type SolutionReviewProps = {
  children?: JSX.Element;
  sessionId: number;
  sessionGithubId: string;
  courseId: number;
  reviewNumber: number;
  settings: SolutionReviewSettings;
  courseTaskId: number | null;
  review: CrossCheckSolutionReviewDto;
  isActiveReview: boolean;
  isMessageSendingPanelVisible?: boolean;
  currentRole: CrossCheckMessageDtoRoleEnum;
  maxScore?: number;
};

function SolutionReview(props: SolutionReviewProps) {
  const {
    children,
    sessionId,
    sessionGithubId,
    courseId,
    reviewNumber,
    settings,
    courseTaskId,
    review,
    isActiveReview,
    isMessageSendingPanelVisible = true,
    currentRole,
    maxScore,
  } = props;
  const { id, dateTime, author, comment, score, messages, criteria } = review;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModaldata] = useState<CrossCheckCriteriaDataDto[]>([]);

  const showModal = (modalData: CrossCheckCriteriaDataDto[]) => {
    setIsModalVisible(true);
    setModaldata(modalData);
  };

  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const courseService = useMemo(() => new CourseService(courseId), [courseId]);
  const amountUnreadMessages = getAmountUnreadMessages(currentRole, messages);
  const howManyUnreadMessagesText = getHowManyUnreadMessagesText(amountUnreadMessages);
  const { message } = useMessage();

  useEffect(() => {
    if (!courseTaskId || !amountUnreadMessages) return;

    notification.info({
      message: howManyUnreadMessagesText,
    });

    (async () => {
      try {
        await courseService.updateTaskSolutionResultMessages(id, courseTaskId, {
          role: currentRole,
        });
      } catch {
        message.error('An error occurred. Please try later.');
      }
    })();
  }, [courseTaskId, amountUnreadMessages]);

  const handleSubmit = async (values: { content: string }) => {
    setLoading(true);

    const { content } = values;

    if (courseTaskId) {
      try {
        await courseService.postTaskSolutionResultMessages(id, courseTaskId, {
          content: `${markdownLabel}${content}`,
          role: currentRole,
        });

        message.success('The message has been sent.');
        form.resetFields(['content']);
      } catch {
        message.error('An error occurred. Please try later.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Spin spinning={loading}>
      <CrossCheckCriteriaModal modalInfo={modalData} isModalVisible={isModalVisible} showModal={setIsModalVisible} />
      <Row style={{ margin: '8px 0' }}>
        <Col span={24}>
          <Divider style={{ margin: 0 }} />
        </Col>
      </Row>

      {amountUnreadMessages > 0 && (
        <Row>
          <Col>
            <Alert message={howManyUnreadMessagesText} type="info" showIcon />
          </Col>
        </Row>
      )}

      <Row style={{ margin: '16px 0' }}>
        <Col span={24}>
          <Comment
            avatar={
              <UserAvatar
                author={author}
                role={CrossCheckMessageDtoRoleEnum.Reviewer}
                areContactsVisible={settings.areContactsVisible}
                size={32}
              />
            }
            content={
              <>
                <Row>
                  <Col>
                    <Username
                      reviewNumber={reviewNumber}
                      author={author}
                      role={CrossCheckMessageDtoRoleEnum.Reviewer}
                      areContactsVisible={settings.areContactsVisible}
                    />
                  </Col>
                </Row>

                <Row>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(dateTime)}
                  </Text>
                </Row>

                <Row gutter={4} align="middle" style={{ marginTop: 8 }}>
                  <Col>
                    <ScoreIcon maxScore={maxScore} score={score} isOutdatedScore={!isActiveReview} />
                  </Col>
                  <Col>
                    <Text>{score}</Text>
                  </Col>
                </Row>

                <Row style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 12, lineHeight: '12px' }} type="secondary">
                    maximum score: {maxScore ?? 'unknown'}
                  </Text>
                </Row>

                <Row style={{ marginBottom: 10 }}>
                  {!!criteria?.length && <Button onClick={() => showModal(criteria)}>Show detailed feedback</Button>}
                </Row>

                <Row>
                  <Col>
                    <PreparedComment text={comment} />
                  </Col>
                </Row>

                <Row>
                  {settings.areContactsVisible && author && (
                    <StudentDiscord discord={author.discord} textPrefix="Student Discord:" />
                  )}
                </Row>
              </>
            }
          >
            {children}

            {messages.map((message, index) => (
              <Row key={index} style={{ margin: '16px 0' }}>
                <Col>
                  <Message
                    reviewNumber={reviewNumber}
                    message={message}
                    currentRole={currentRole}
                    settings={settings}
                  />
                </Col>
              </Row>
            ))}

            {isMessageSendingPanelVisible && (
              <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Form form={form} onFinish={handleSubmit} initialValues={{ content: '' }}>
                    <MessageSendingPanel
                      sessionId={sessionId}
                      sessionGithubId={sessionGithubId}
                      author={author}
                      currentRole={currentRole}
                      areContactsVisible={settings.areContactsVisible}
                    />
                  </Form>
                </Col>
              </Row>
            )}
          </Comment>
        </Col>
      </Row>

      <style jsx>{`
        :global(.ant-comment-inner) {
          padding: 0 !important;
        }

        :global(.ant-comment-avatar) {
          position: sticky !important;
          top: 16px;
          align-self: start;
        }

        :global(.ant-comment-avatar img) {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </Spin>
  );
}

export default SolutionReview;

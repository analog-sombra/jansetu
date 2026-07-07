"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  InvitationSubtype,
  MlaPaMeetingType,
  UserRole,
} from "@prisma/client";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from "antd";

import { useLanguage } from "@/components/provider/language_provider";
import {
  createMlaPaMeetingAction,
  getMlaPaMeetingUsersAction,
  type MlaPaMeetingUserLite,
} from "@/actions/mla-pa/meeting";

const { Title, Text } = Typography;
const DATE_TIME_FORMAT = "DD-MM-YYYY hh:mm A";

const COPY = {
  en: {
    title: "Create MLA Schedule",
    subtitle: "MLA-PA can schedule meetings where CAMP_HEAD attends on behalf of MLA.",
    notAllowed: "Only MLA-PA can create meetings.",
    mlaUser: "MLA User",
    selectMlaUser: "Select MLA user",
    campHeadUser: "CAMP_HEAD User",
    selectCampHeadUser: "Select CAMP_HEAD user",
    meetingType: "Type",
    selectType: "Select type",
    invitationSubtype: "Invitation Subtype",
    selectInvitationSubtype: "Select invitation subtype",
    invitationOtherPurpose: "Other Invitation Purpose",
    enterInvitationOtherPurpose: "Enter invitation purpose",
    purpose: "Purpose",
    enterPurpose: "Enter purpose",
    dateTime: "Date & Time",
    selectDateTime: "Select date and time",
    meetingPlace: "Meeting Place",
    enterMeetingPlace: "Enter meeting place",
    giftToCarry: "Gift To Carry",
    enterGiftToCarry: "Enter gift details",
    selfDraftedLetter: "Self Drafted Letter",
    enterSelfDraftedLetter: "Enter drafted letter text",
    cancel: "Cancel",
    create: "Create Meeting",
    failedUsers: "Unable to load users",
    failedCreate: "Failed to create meeting",
    successCreate: "Meeting created successfully.",
  },
  hi: {
    title: "MLA शेड्यूल बनाएँ",
    subtitle: "MLA-PA बैठक शेड्यूल कर सकता है जहाँ CAMP_HEAD MLA की ओर से जाएगा।",
    notAllowed: "केवल MLA-PA बैठक बना सकता है।",
    mlaUser: "MLA यूज़र",
    selectMlaUser: "MLA यूज़र चुनें",
    campHeadUser: "CAMP_HEAD यूज़र",
    selectCampHeadUser: "CAMP_HEAD यूज़र चुनें",
    meetingType: "प्रकार",
    selectType: "प्रकार चुनें",
    invitationSubtype: "निमंत्रण उप-प्रकार",
    selectInvitationSubtype: "निमंत्रण उप-प्रकार चुनें",
    invitationOtherPurpose: "अन्य निमंत्रण उद्देश्य",
    enterInvitationOtherPurpose: "निमंत्रण उद्देश्य दर्ज करें",
    purpose: "उद्देश्य",
    enterPurpose: "उद्देश्य दर्ज करें",
    dateTime: "दिनांक और समय",
    selectDateTime: "दिनांक और समय चुनें",
    meetingPlace: "बैठक स्थान",
    enterMeetingPlace: "बैठक स्थान दर्ज करें",
    giftToCarry: "साथ ले जाने वाला उपहार",
    enterGiftToCarry: "उपहार विवरण दर्ज करें",
    selfDraftedLetter: "स्व-ड्राफ्टेड पत्र",
    enterSelfDraftedLetter: "ड्राफ्टेड पत्र दर्ज करें",
    cancel: "रद्द करें",
    create: "बैठक बनाएँ",
    failedUsers: "यूज़र लोड नहीं हो सके",
    failedCreate: "बैठक बनाना विफल रहा",
    successCreate: "बैठक सफलतापूर्वक बना दी गई।",
  },
  pa: {
    title: "MLA ਸ਼ਡਿਊਲ ਬਣਾਓ",
    subtitle: "MLA-PA ਮੀਟਿੰਗ ਸ਼ਡਿਊਲ ਕਰ ਸਕਦਾ ਹੈ ਜਿੱਥੇ CAMP_HEAD MLA ਦੀ ਥਾਂ ਜਾਵੇਗਾ।",
    notAllowed: "ਕੇਵਲ MLA-PA ਮੀਟਿੰਗ ਬਣਾ ਸਕਦਾ ਹੈ।",
    mlaUser: "MLA ਯੂਜ਼ਰ",
    selectMlaUser: "MLA ਯੂਜ਼ਰ ਚੁਣੋ",
    campHeadUser: "CAMP_HEAD ਯੂਜ਼ਰ",
    selectCampHeadUser: "CAMP_HEAD ਯੂਜ਼ਰ ਚੁਣੋ",
    meetingType: "ਕਿਸਮ",
    selectType: "ਕਿਸਮ ਚੁਣੋ",
    invitationSubtype: "ਨਿਮੰਤਰਣ ਉਪ-ਕਿਸਮ",
    selectInvitationSubtype: "ਨਿਮੰਤਰਣ ਉਪ-ਕਿਸਮ ਚੁਣੋ",
    invitationOtherPurpose: "ਹੋਰ ਨਿਮੰਤਰਣ ਉਦੇਸ਼",
    enterInvitationOtherPurpose: "ਨਿਮੰਤਰਣ ਉਦੇਸ਼ ਦਰਜ ਕਰੋ",
    purpose: "ਉਦੇਸ਼",
    enterPurpose: "ਉਦੇਸ਼ ਦਰਜ ਕਰੋ",
    dateTime: "ਮਿਤੀ ਅਤੇ ਸਮਾਂ",
    selectDateTime: "ਮਿਤੀ ਅਤੇ ਸਮਾਂ ਚੁਣੋ",
    meetingPlace: "ਮੀਟਿੰਗ ਸਥਾਨ",
    enterMeetingPlace: "ਮੀਟਿੰਗ ਸਥਾਨ ਦਰਜ ਕਰੋ",
    giftToCarry: "ਨਾਲ ਲੈ ਜਾਣ ਵਾਲਾ ਤੋਹਫ਼ਾ",
    enterGiftToCarry: "ਤੋਹਫ਼ੇ ਦਾ ਵੇਰਵਾ ਦਰਜ ਕਰੋ",
    selfDraftedLetter: "ਸਵੈ-ਡਰਾਫਟ ਕੀਤਾ ਪੱਤਰ",
    enterSelfDraftedLetter: "ਡਰਾਫਟ ਪੱਤਰ ਦਰਜ ਕਰੋ",
    cancel: "ਰੱਦ ਕਰੋ",
    create: "ਮੀਟਿੰਗ ਬਣਾਓ",
    failedUsers: "ਯੂਜ਼ਰ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੇ",
    failedCreate: "ਮੀਟਿੰਗ ਬਣਾਉਣ ਵਿੱਚ ਅਸਫਲਤਾ",
    successCreate: "ਮੀਟਿੰਗ ਸਫਲਤਾਪੂਰਵਕ ਬਣ ਗਈ।",
  },
} as const;

const MEETING_TYPES: MlaPaMeetingType[] = [
  MlaPaMeetingType.INVITATION,
  MlaPaMeetingType.CONSTITUENCY_VISIT,
  MlaPaMeetingType.CITIZEN_MEET,
  MlaPaMeetingType.DEPARTMENT_VISIT,
  MlaPaMeetingType.PERSONAL_MEET,
];

const INVITATION_SUBTYPES: InvitationSubtype[] = [
  InvitationSubtype.MARRIAGE,
  InvitationSubtype.BIRTHDAY,
  InvitationSubtype.FUNERAL,
  InvitationSubtype.OTHER,
];

type FormValues = {
  mlaUserId: string;
  campHeadUserId: string;
  type: MlaPaMeetingType;
  invitationSubtype?: InvitationSubtype;
  invitationOtherPurpose?: string;
  purpose: string;
  scheduledAt: { toISOString(): string };
  meetingPlace: string;
  giftToCarry?: string;
  selfDraftedLetter?: string;
};

function getTypeLabel(type: MlaPaMeetingType): string {
  const labels: Record<MlaPaMeetingType, string> = {
    INVITATION: "Invitation",
    CONSTITUENCY_VISIT: "Constituency Visit",
    CITIZEN_MEET: "Citizen Meet",
    DEPARTMENT_VISIT: "Department Visit",
    PERSONAL_MEET: "Personal Meet",
  };
  return labels[type] ?? type;
}

function getInvitationSubtypeLabel(value: InvitationSubtype): string {
  const labels: Record<InvitationSubtype, string> = {
    MARRIAGE: "Marriage",
    BIRTHDAY: "Birthday",
    FUNERAL: "Funeral",
    OTHER: "Other",
  };
  return labels[value] ?? value;
}

export default function CreateMlaPaMeetingClient({
  userRole,
}: {
  userRole: UserRole;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = COPY[language];
  const [form] = Form.useForm<FormValues>();
  const [mlaUsers, setMlaUsers] = useState<MlaPaMeetingUserLite[]>([]);
  const [campHeadUsers, setCampHeadUsers] = useState<MlaPaMeetingUserLite[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedType = Form.useWatch("type", form) ?? MlaPaMeetingType.INVITATION;
  const selectedInvitationSubtype = Form.useWatch("invitationSubtype", form);
  const isInvitation = selectedType === MlaPaMeetingType.INVITATION;

  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      const result = await getMlaPaMeetingUsersAction();
      setLoadingUsers(false);

      if (!result.ok) {
        setError(result.error ?? copy.failedUsers);
        return;
      }

      setMlaUsers(result.mlaUsers ?? []);
      setCampHeadUsers(result.campHeadUsers ?? []);
    }

    void loadUsers();
  }, [copy.failedUsers]);

  useEffect(() => {
    if (!isInvitation) {
      form.setFieldsValue({
        invitationSubtype: undefined,
        invitationOtherPurpose: undefined,
        giftToCarry: undefined,
        selfDraftedLetter: undefined,
      });
    }
  }, [form, isInvitation]);

  async function onFinish(values: FormValues) {
    if (userRole !== "MLA_PA") {
      setError(copy.notAllowed);
      return;
    }

    setSaving(true);
    const result = await createMlaPaMeetingAction({
      mlaUserId: values.mlaUserId,
      campHeadUserId: values.campHeadUserId,
      type: values.type,
      invitationSubtype: values.invitationSubtype,
      invitationOtherPurpose: values.invitationOtherPurpose,
      purpose: values.purpose,
      scheduledAt: values.scheduledAt.toISOString(),
      meetingPlace: values.meetingPlace,
      giftToCarry: values.giftToCarry,
      selfDraftedLetter: values.selfDraftedLetter,
    });
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? copy.failedCreate);
      return;
    }

    setError("");
    setMessage(copy.successCreate);
    form.resetFields();
    form.setFieldValue("type", MlaPaMeetingType.INVITATION);
    setTimeout(() => router.push("/mla-pa/meeting-section"), 500);
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            {copy.title}
          </Title>
          <Text type="secondary">{copy.subtitle}</Text>
        </div>
      </div>

      {error && (
        <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />
      )}
      {message && (
        <Alert
          type="success"
          showIcon
          title={message}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card style={{ borderRadius: 8 }}>
        <Form<FormValues>
          layout="vertical"
          form={form}
          initialValues={{ type: MlaPaMeetingType.INVITATION }}
          onFinish={(values) => void onFinish(values)}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={copy.mlaUser}
                name="mlaUserId"
                rules={[{ required: true, message: copy.selectMlaUser }]}
              >
                <Select
                  showSearch
                  loading={loadingUsers}
                  placeholder={copy.selectMlaUser}
                  options={mlaUsers.map((user) => ({
                    value: user.id,
                    label: `${user.name ?? "Unnamed"} (${user.mobile})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={copy.campHeadUser}
                name="campHeadUserId"
                rules={[{ required: true, message: copy.selectCampHeadUser }]}
              >
                <Select
                  showSearch
                  loading={loadingUsers}
                  placeholder={copy.selectCampHeadUser}
                  options={campHeadUsers.map((user) => ({
                    value: user.id,
                    label: `${user.name ?? "Unnamed"} (${user.mobile})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={copy.meetingType}
                name="type"
                rules={[{ required: true, message: copy.selectType }]}
              >
                <Select
                  options={MEETING_TYPES.map((value) => ({
                    value,
                    label: getTypeLabel(value),
                  }))}
                />
              </Form.Item>
            </Col>

            {isInvitation && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.invitationSubtype}
                    name="invitationSubtype"
                    rules={[
                      { required: true, message: copy.selectInvitationSubtype },
                    ]}
                  >
                    <Select
                      options={INVITATION_SUBTYPES.map((value) => ({
                        value,
                        label: getInvitationSubtypeLabel(value),
                      }))}
                    />
                  </Form.Item>
                </Col>
                {selectedInvitationSubtype === InvitationSubtype.OTHER && (
                  <Col xs={24}>
                    <Form.Item
                      label={copy.invitationOtherPurpose}
                      name="invitationOtherPurpose"
                      rules={[
                        {
                          required: true,
                          message: copy.enterInvitationOtherPurpose,
                        },
                      ]}
                    >
                      <Input placeholder={copy.enterInvitationOtherPurpose} />
                    </Form.Item>
                  </Col>
                )}
              </>
            )}

            <Col xs={24}>
              <Form.Item
                label={copy.purpose}
                name="purpose"
                rules={[{ required: true, message: copy.enterPurpose }]}
              >
                <Input.TextArea rows={4} placeholder={copy.enterPurpose} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={copy.dateTime}
                name="scheduledAt"
                rules={[{ required: true, message: copy.selectDateTime }]}
              >
                <DatePicker
                  showTime={{
                    use12Hours: true,
                    format: "hh:mm A",
                    minuteStep: 5,
                  }}
                  needConfirm={false}
                  style={{ width: "100%" }}
                  format={DATE_TIME_FORMAT}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={copy.meetingPlace}
                name="meetingPlace"
                rules={[{ required: true, message: copy.enterMeetingPlace }]}
              >
                <Input placeholder={copy.enterMeetingPlace} />
              </Form.Item>
            </Col>

            {isInvitation && (
              <>
                <Col xs={24}>
                  <Form.Item
                    label={copy.giftToCarry}
                    name="giftToCarry"
                    rules={[{ required: true, message: copy.enterGiftToCarry }]}
                  >
                    <Input.TextArea rows={2} placeholder={copy.enterGiftToCarry} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label={copy.selfDraftedLetter}
                    name="selfDraftedLetter"
                    rules={[
                      { required: true, message: copy.enterSelfDraftedLetter },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder={copy.enterSelfDraftedLetter}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <Link href="/mla-pa/meeting-section">
              <Button>{copy.cancel}</Button>
            </Link>
            <Button
              htmlType="submit"
              type="primary"
              loading={saving}
              disabled={userRole !== "MLA_PA"}
              style={{
                background: "#1a3c6e",
                borderColor: "#1a3c6e",
                fontWeight: 700,
              }}
            >
              {copy.create}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

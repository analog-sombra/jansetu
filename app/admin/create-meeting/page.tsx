"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

import {
  MEETING_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  UserLite,
} from "@/app/admin/meeting-data";
import { useLanguage } from "@/components/language-provider";
import { getLocalizedArea } from "@/lib/complaint-i18n";
import { RAJOURI_GARDEN_AREAS } from "@/lib/constants";

const { Title, Text } = Typography;
const DATE_TIME_FORMAT = "DD-MM-YYYY hh:mm A";

const PAGE_COPY = {
  en: {
    title: "Create Meeting",
    subtitle: "Admin can create all four meeting types and send citizen meets for approval flow.",
    openMeetingSection: "Open Meeting Section",
    meetingType: "Meeting Type",
    selectMeetingType: "Select meeting type",
    assignToUser: "Assign To",
    selectAssignedUser: "Select assigned user",
    noReportUsers: "No REPORT users available",
    purpose: "Purpose",
    enterPurpose: "Enter purpose",
    meetingPurpose: "Meeting purpose",
    meetingDateTime: "Meeting Date & Time",
    selectMeetingDateTime: "Select meeting date and time",
    meetingPlace: "Meeting Place",
    enterMeetingPlace: "Enter meeting place",
    preferredDateTime: "Preferred Date & Time",
    selectPreferredDateTime: "Select preferred date and time",
    priority: "Priority",
    selectPriority: "Select priority",
    citizenMobile: "Citizen Mobile",
    enterCitizenMobile: "Enter citizen mobile",
    citizenName: "Citizen Name",
    enterCitizenName: "Enter citizen name",
    citizenArea: "Area",
    selectCitizenArea: "Select area",
    citizenDetails: "Citizen Details",
    enterCitizenDetails: "Enter citizen details",
    requestDetails: "Request details",
    contactMobile: "Mobile",
    enterContactMobile: "Enter mobile",
    contactName: "Name",
    enterContactName: "Enter name",
    designation: "Designation",
    enterDesignation: "Enter designation",
    department: "Department",
    enterDepartment: "Enter department",
    invalidMobile: "Enter a valid 10-digit mobile number",
    failedUsers: "Unable to load users",
    failedCreate: "Failed to create meeting",
    successCreate: "Meeting created successfully.",
    userLookupFailed: "Unable to fetch user details for the provided mobile number",
    fetchingUserDetails: "Fetching user details...",
    cancel: "Cancel",
    createMeeting: "Create Meeting",
    typeConstituency: "Constituency Visit",
    typeDepartment: "Department Visit",
    typeCitizen: "Citizen Meet",
    typePersonal: "Personal Meet",
    priorityLow: "Low",
    priorityMedium: "Medium",
    priorityHigh: "High",
    priorityUrgent: "Urgent",
  },
  hi: {
    title: "बैठक बनाएँ",
    subtitle: "एडमिन चारों प्रकार की बैठक बना सकता है और नागरिक बैठक को अनुमोदन प्रक्रिया में भेज सकता है।",
    openMeetingSection: "बैठक अनुभाग खोलें",
    meetingType: "बैठक प्रकार",
    selectMeetingType: "बैठक प्रकार चुनें",
    assignToUser: "यूज़र को असाइन करें",
    selectAssignedUser: "असाइन यूज़र चुनें",
    noReportUsers: "कोई REPORT यूज़र उपलब्ध नहीं है",
    purpose: "उद्देश्य",
    enterPurpose: "उद्देश्य दर्ज करें",
    meetingPurpose: "बैठक का उद्देश्य",
    meetingDateTime: "बैठक दिनांक और समय",
    selectMeetingDateTime: "बैठक दिनांक और समय चुनें",
    meetingPlace: "बैठक स्थान",
    enterMeetingPlace: "बैठक स्थान दर्ज करें",
    preferredDateTime: "पसंदीदा दिनांक और समय",
    selectPreferredDateTime: "पसंदीदा दिनांक और समय चुनें",
    priority: "प्राथमिकता",
    selectPriority: "प्राथमिकता चुनें",
    citizenMobile: "नागरिक मोबाइल",
    enterCitizenMobile: "नागरिक मोबाइल दर्ज करें",
    citizenName: "नागरिक नाम",
    enterCitizenName: "नागरिक नाम दर्ज करें",
    citizenArea: "क्षेत्र",
    selectCitizenArea: "क्षेत्र चुनें",
    citizenDetails: "नागरिक विवरण",
    enterCitizenDetails: "नागरिक विवरण दर्ज करें",
    requestDetails: "अनुरोध विवरण",
    contactMobile: "मोबाइल",
    enterContactMobile: "मोबाइल दर्ज करें",
    contactName: "नाम",
    enterContactName: "नाम दर्ज करें",
    designation: "पदनाम",
    enterDesignation: "पदनाम दर्ज करें",
    department: "विभाग",
    enterDepartment: "विभाग दर्ज करें",
    invalidMobile: "मान्य 10 अंकों का मोबाइल नंबर दर्ज करें",
    failedUsers: "यूज़र लोड नहीं हो सके",
    failedCreate: "बैठक बनाना विफल रहा",
    successCreate: "बैठक सफलतापूर्वक बना दी गई।",
    userLookupFailed: "दिए गए मोबाइल नंबर के लिए यूज़र विवरण प्राप्त नहीं हो सके",
    fetchingUserDetails: "यूज़र विवरण प्राप्त किए जा रहे हैं...",
    cancel: "रद्द करें",
    createMeeting: "बैठक बनाएँ",
    typeConstituency: "निर्वाचन क्षेत्र भ्रमण",
    typeDepartment: "विभागीय बैठक",
    typeCitizen: "नागरिक बैठक",
    typePersonal: "व्यक्तिगत बैठक",
    priorityLow: "निम्न",
    priorityMedium: "मध्यम",
    priorityHigh: "उच्च",
    priorityUrgent: "अत्यावश्यक",
  },
  pa: {
    title: "ਮੀਟਿੰਗ ਬਣਾਓ",
    subtitle: "ਐਡਮਿਨ ਸਾਰੀਆਂ ਚਾਰ ਕਿਸਮਾਂ ਦੀਆਂ ਮੀਟਿੰਗਾਂ ਬਣਾਕੇ ਨਾਗਰਿਕ ਮੀਟਿੰਗ ਨੂੰ ਮਨਜ਼ੂਰੀ ਪ੍ਰਕਿਰਿਆ ਵਿੱਚ ਭੇਜ ਸਕਦਾ ਹੈ।",
    openMeetingSection: "ਮੀਟਿੰਗ ਭਾਗ ਖੋਲ੍ਹੋ",
    meetingType: "ਮੀਟਿੰਗ ਕਿਸਮ",
    selectMeetingType: "ਮੀਟਿੰਗ ਕਿਸਮ ਚੁਣੋ",
    assignToUser: "ਯੂਜ਼ਰ ਨੂੰ ਅਸਾਈਨ ਕਰੋ",
    selectAssignedUser: "ਅਸਾਈਨ ਕੀਤਾ ਯੂਜ਼ਰ ਚੁਣੋ",
    noReportUsers: "ਕੋਈ REPORT ਯੂਜ਼ਰ ਉਪਲਬਧ ਨਹੀਂ",
    purpose: "ਉਦੇਸ਼",
    enterPurpose: "ਉਦੇਸ਼ ਦਰਜ ਕਰੋ",
    meetingPurpose: "ਮੀਟਿੰਗ ਦਾ ਉਦੇਸ਼",
    meetingDateTime: "ਮੀਟਿੰਗ ਮਿਤੀ ਅਤੇ ਸਮਾਂ",
    selectMeetingDateTime: "ਮੀਟਿੰਗ ਮਿਤੀ ਅਤੇ ਸਮਾਂ ਚੁਣੋ",
    meetingPlace: "ਮੀਟਿੰਗ ਸਥਾਨ",
    enterMeetingPlace: "ਮੀਟਿੰਗ ਸਥਾਨ ਦਰਜ ਕਰੋ",
    preferredDateTime: "ਪਸੰਦੀਦਾ ਮਿਤੀ ਅਤੇ ਸਮਾਂ",
    selectPreferredDateTime: "ਪਸੰਦੀਦਾ ਮਿਤੀ ਅਤੇ ਸਮਾਂ ਚੁਣੋ",
    priority: "ਤਰਜੀਹ",
    selectPriority: "ਤਰਜੀਹ ਚੁਣੋ",
    citizenMobile: "ਨਾਗਰਿਕ ਮੋਬਾਈਲ",
    enterCitizenMobile: "ਨਾਗਰਿਕ ਮੋਬਾਈਲ ਦਰਜ ਕਰੋ",
    citizenName: "ਨਾਗਰਿਕ ਨਾਮ",
    enterCitizenName: "ਨਾਗਰਿਕ ਨਾਮ ਦਰਜ ਕਰੋ",
    citizenArea: "ਇਲਾਕਾ",
    selectCitizenArea: "ਇਲਾਕਾ ਚੁਣੋ",
    citizenDetails: "ਨਾਗਰਿਕ ਵੇਰਵਾ",
    enterCitizenDetails: "ਨਾਗਰਿਕ ਵੇਰਵਾ ਦਰਜ ਕਰੋ",
    requestDetails: "ਬੇਨਤੀ ਵੇਰਵਾ",
    contactMobile: "ਮੋਬਾਈਲ",
    enterContactMobile: "ਮੋਬਾਈਲ ਦਰਜ ਕਰੋ",
    contactName: "ਨਾਮ",
    enterContactName: "ਨਾਮ ਦਰਜ ਕਰੋ",
    designation: "ਹੁੱਦਾ",
    enterDesignation: "ਹੁੱਦਾ ਦਰਜ ਕਰੋ",
    department: "ਵਿਭਾਗ",
    enterDepartment: "ਵਿਭਾਗ ਦਰਜ ਕਰੋ",
    invalidMobile: "ਵੈਧ 10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ",
    failedUsers: "ਯੂਜ਼ਰ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੇ",
    failedCreate: "ਮੀਟਿੰਗ ਬਣਾਉਣ ਵਿੱਚ ਅਸਫਲਤਾ",
    successCreate: "ਮੀਟਿੰਗ ਸਫਲਤਾਪੂਰਵਕ ਬਣ ਗਈ।",
    userLookupFailed: "ਦਿੱਤੇ ਮੋਬਾਈਲ ਨੰਬਰ ਲਈ ਯੂਜ਼ਰ ਵੇਰਵਾ ਨਹੀਂ ਮਿਲ ਸਕਿਆ",
    fetchingUserDetails: "ਯੂਜ਼ਰ ਵੇਰਵਾ ਲਿਆ ਜਾ ਰਿਹਾ ਹੈ...",
    cancel: "ਰੱਦ ਕਰੋ",
    createMeeting: "ਮੀਟਿੰਗ ਬਣਾਓ",
    typeConstituency: "ਹਲਕਾ ਦੌਰਾ",
    typeDepartment: "ਵਿਭਾਗੀ ਮੀਟਿੰਗ",
    typeCitizen: "ਨਾਗਰਿਕ ਮੀਟਿੰਗ",
    typePersonal: "ਨਿੱਜੀ ਮੀਟਿੰਗ",
    priorityLow: "ਘੱਟ",
    priorityMedium: "ਮੱਧਮ",
    priorityHigh: "ਉੱਚ",
    priorityUrgent: "ਤੁਰੰਤ",
  },
} as const;

type FormValues = {
  assignedToUserId: string;
  type: "CONSTITUENCY_VISIT" | "DEPARTMENT_VISIT" | "CITIZEN_MEET" | "PERSONAL_MEET";
  purpose: string;
  meetingDateTime?: { toISOString(): string };
  meetingPlace?: string;
  preferredDateTime?: { toISOString(): string };
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  citizenName?: string;
  citizenMobile?: string;
  citizenArea?: string;
  citizenDetails?: string;
  contactName?: string;
  contactMobile?: string;
  contactDesignation?: string;
  contactDepartment?: string;
};

type OfficerLookup = {
  name: string;
  designation: string;
  department: { name: string };
};

export default function CreateMeetingPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const copy = PAGE_COPY[language];
  const [form] = Form.useForm<FormValues>();
  const [users, setUsers] = useState<UserLite[]>([]);
  const [selectedType, setSelectedType] = useState<FormValues["type"]>("CONSTITUENCY_VISIT");
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [citizenDetailsLocked, setCitizenDetailsLocked] = useState(false);
  const [contactDetailsLocked, setContactDetailsLocked] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<string>("");

  const reportUsers = users.filter((user) => user.role === "REPORT");
  const mobileRules = [
    { required: true },
    { pattern: /^\d{10}$/, message: copy.invalidMobile },
  ];

  const meetingTypeOptions = MEETING_TYPE_OPTIONS.map((option) => {
    const localizedLabel: Record<FormValues["type"], string> = {
      CONSTITUENCY_VISIT: copy.typeConstituency,
      DEPARTMENT_VISIT: copy.typeDepartment,
      CITIZEN_MEET: copy.typeCitizen,
      PERSONAL_MEET: copy.typePersonal,
    };
    return {
      value: option.value,
      label: localizedLabel[option.value],
    };
  });

  const priorityOptions = PRIORITY_OPTIONS.map((option) => {
    const localizedLabel = {
      LOW: copy.priorityLow,
      MEDIUM: copy.priorityMedium,
      HIGH: copy.priorityHigh,
      URGENT: copy.priorityUrgent,
    }[option.value];
    return {
      value: option.value,
      label: localizedLabel,
    };
  });

  const areaOptions = RAJOURI_GARDEN_AREAS.map((area) => ({
    value: area,
    label: getLocalizedArea(area, t),
  }));

  function normalizeMobile(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  async function fetchUserByMobile(mobile: string, target: "citizen" | "contact") {
    if (mobile.length !== 10) {
      if (target === "citizen") {
        setCitizenDetailsLocked(false);
      } else {
        setContactDetailsLocked(false);
      }
      return;
    }

    setLoadingLookup(true);
    const shouldLookupOfficer = target === "contact" && selectedType === "DEPARTMENT_VISIT";
    const roleQuery = target === "citizen" ? "&role=CITIZEN" : "";
    const endpoint = shouldLookupOfficer
      ? `/api/admin/officers?mobile=${mobile}`
      : `/api/admin/users?mobile=${mobile}${roleQuery}`;
    const response = await fetch(endpoint);
    const result = await response.json();
    setLoadingLookup(false);

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setError(result.error ?? copy.userLookupFailed);
      return;
    }

    const matchedOfficer = shouldLookupOfficer ? (result.officer as OfficerLookup | null) : null;
    const matchedUser = shouldLookupOfficer
      ? null
      : (result.user as (UserLite & { address?: string | null }) | null);

    if (!matchedOfficer && !matchedUser) {
      if (target === "citizen") {
        setCitizenDetailsLocked(false);
      } else {
        if (shouldLookupOfficer) {
          setError(copy.userLookupFailed);
        }
        form.setFieldsValue({
          contactName: undefined,
          contactDesignation: undefined,
          contactDepartment: undefined,
        });
        setContactDetailsLocked(false);
      }
      return;
    }

    if (target === "citizen" && matchedUser) {
      form.setFieldsValue({
        citizenName: matchedUser.name ?? form.getFieldValue("citizenName"),
        citizenArea: matchedUser.address ?? form.getFieldValue("citizenArea"),
      });
      setCitizenDetailsLocked(true);
    } else if (shouldLookupOfficer && matchedOfficer) {
      form.setFieldsValue({
        contactName: matchedOfficer.name,
        contactDesignation: matchedOfficer.designation,
        contactDepartment: matchedOfficer.department.name,
      });
      setContactDetailsLocked(true);
    } else if (matchedUser) {
      form.setFieldsValue({
        contactName: matchedUser.name ?? form.getFieldValue("contactName"),
      });
      setContactDetailsLocked(true);
    }
  }

  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      const response = await fetch("/api/admin/users?role=REPORT");
      const result = await response.json();
      setLoadingUsers(false);

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setError(result.error ?? copy.failedUsers);
        return;
      }

      setUsers(result.users ?? []);
    }

    void loadUsers();
  }, [copy.failedUsers, router]);

  async function onFinish(values: FormValues) {
    setSaving(true);
    const payload = {
      assignedToUserId: values.assignedToUserId,
      type: values.type,
      purpose: values.purpose,
      meetingDateTime: values.meetingDateTime?.toISOString(),
      meetingPlace: values.meetingPlace,
      preferredDateTime: values.preferredDateTime?.toISOString(),
      priority: values.priority,
      citizenName: values.citizenName,
      citizenMobile: values.citizenMobile,
      citizenArea: values.citizenArea,
      citizenDetails: values.citizenDetails,
      contactName: values.contactName,
      contactMobile: values.contactMobile,
      contactDesignation: values.contactDesignation,
      contactDepartment: values.contactDepartment,
    };

    const response = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    setSaving(false);
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok) {
      setError(result.error ?? copy.failedCreate);
      return;
    }

    setMessage(copy.successCreate);
    setError("");
    form.resetFields();
    setSelectedType("CONSTITUENCY_VISIT");
    setCitizenDetailsLocked(false);
    setContactDetailsLocked(false);
    setTimeout(() => {
      router.push("/admin/meeting-section");
    }, 600);
  }

  const isCitizenMeet = selectedType === "CITIZEN_MEET";
  const isDepartmentVisit = selectedType === "DEPARTMENT_VISIT";
  const showContactFields = selectedType === "DEPARTMENT_VISIT" || selectedType === "PERSONAL_MEET";

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
            {copy.title}
          </Title>
          <Text type="secondary">
            {copy.subtitle}
          </Text>
        </div>
        {/* <Link href="/admin/meeting-section">
          <Button style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}>
            {copy.openMeetingSection}
          </Button>
        </Link> */}
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          title={error}
        />
      )}

      {message && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 20 }}
          title={message}
        />
      )}

      <Card style={{ borderRadius: 8 }}>
        <Form<FormValues>
          layout="vertical"
          form={form}
          initialValues={{ type: "CONSTITUENCY_VISIT" }}
          onFinish={(values) => void onFinish(values)}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={copy.meetingType}
                name="type"
                rules={[{ required: true, message: copy.selectMeetingType }]}
              >
                <Select
                  options={meetingTypeOptions}
                  onChange={(value) => setSelectedType(value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={copy.assignToUser}
                name="assignedToUserId"
                rules={[{ required: true, message: copy.selectAssignedUser }]}
              >
                <Select
                  showSearch
                  loading={loadingUsers}
                  notFoundContent={copy.noReportUsers}
                  options={reportUsers.map((user) => ({
                    label: `${user.name ?? "Unnamed User"} (${user.mobile})`,
                    value: user.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label={copy.purpose}
                name="purpose"
                rules={[{ required: true, message: copy.enterPurpose }]}
              >
                <Input.TextArea rows={4} placeholder={copy.meetingPurpose} />
              </Form.Item>
            </Col>

            {!isCitizenMeet && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.meetingDateTime}
                    name="meetingDateTime"
                    rules={[{ required: true, message: copy.selectMeetingDateTime }]}
                  >
                    <DatePicker
                      showTime={{ use12Hours: true, format: "hh:mm A", minuteStep: 5 }}
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
              </>
            )}

            {isCitizenMeet && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.preferredDateTime}
                    name="preferredDateTime"
                    rules={[{ required: true, message: copy.selectPreferredDateTime }]}
                  >
                    <DatePicker
                      showTime={{ use12Hours: true, format: "hh:mm A", minuteStep: 5 }}
                      style={{ width: "100%" }}
                      format={DATE_TIME_FORMAT}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.priority}
                    name="priority"
                    rules={[{ required: true, message: copy.selectPriority }]}
                  >
                    <Select options={priorityOptions} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.citizenMobile}
                    name="citizenMobile"
                    rules={mobileRules.map((rule, index) =>
                      index === 0 ? { ...rule, message: copy.enterCitizenMobile } : rule,
                    )}
                  >
                    <Input
                      placeholder={copy.enterCitizenMobile}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(event) => {
                        const sanitized = normalizeMobile(event.target.value);
                        form.setFieldValue("citizenMobile", sanitized);
                        if (sanitized.length === 10) {
                          void fetchUserByMobile(sanitized, "citizen");
                        } else {
                          setCitizenDetailsLocked(false);
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.citizenName}
                    name="citizenName"
                    rules={[{ required: true, message: copy.enterCitizenName }]}
                  >
                    <Input placeholder={copy.enterCitizenName} disabled={citizenDetailsLocked} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.citizenArea}
                    name="citizenArea"
                    rules={[{ required: true, message: copy.selectCitizenArea }]}
                  >
                    <Select
                      showSearch
                      options={areaOptions}
                      placeholder={copy.selectCitizenArea}
                      disabled={citizenDetailsLocked}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    label={copy.citizenDetails}
                    name="citizenDetails"
                    rules={[{ required: true, message: copy.enterCitizenDetails }]}
                  >
                    <Input.TextArea rows={4} placeholder={copy.requestDetails} />
                  </Form.Item>
                </Col>
              </>
            )}

            {showContactFields && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.contactMobile}
                    name="contactMobile"
                    rules={mobileRules.map((rule, index) =>
                      index === 0 ? { ...rule, message: copy.enterContactMobile } : rule,
                    )}
                  >
                    <Input
                      placeholder={copy.enterContactMobile}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(event) => {
                        const sanitized = normalizeMobile(event.target.value);
                        form.setFieldValue("contactMobile", sanitized);
                        if (sanitized.length === 10) {
                          void fetchUserByMobile(sanitized, "contact");
                        } else {
                          if (selectedType === "DEPARTMENT_VISIT") {
                            form.setFieldsValue({
                              contactName: undefined,
                              contactDesignation: undefined,
                              contactDepartment: undefined,
                            });
                          }
                          setContactDetailsLocked(false);
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.contactName}
                    name="contactName"
                    rules={[{ required: true, message: copy.enterContactName }]}
                  >
                    <Input
                      placeholder={copy.enterContactName}
                      disabled={isDepartmentVisit || contactDetailsLocked}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.designation}
                    name="contactDesignation"
                    rules={[{ required: true, message: copy.enterDesignation }]}
                  >
                    <Input placeholder={copy.enterDesignation} disabled={isDepartmentVisit} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.department}
                    name="contactDepartment"
                    rules={[{ required: true, message: copy.enterDepartment }]}
                  >
                    <Input placeholder={copy.enterDepartment} disabled={isDepartmentVisit} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          {loadingLookup && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              title={copy.fetchingUserDetails}
            />
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <Link href="/admin/meeting-section">
              <Button>{copy.cancel}</Button>
            </Link>
            <Button
              htmlType="submit"
              type="primary"
              loading={saving}
              style={{ background: "#1a3c6e", borderColor: "#1a3c6e", fontWeight: 700 }}
            >
              {copy.createMeeting}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

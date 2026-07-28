"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MEETINGPRIORITY,
  MEETINGTYPE,
  INVITATIONSUBTYPE,
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
  createAdminMeetingAction,
  getAdminMeetingAssigneesAction,
  lookupAdminMeetingCitizenByMobileAction,
  lookupAdminMeetingContactByMobileAction,
  type AdminMeetingAssignee,
} from "@/actions/admin/meeting";
import { RAJOURI_GARDEN_AREAS } from "@/lib/constants";

const { Title, Text } = Typography;
const DATE_TIME_FORMAT = "DD-MM-YYYY hh:mm A";

const PAGE_COPY = {
  en: {
    title: "Create Meeting",
    subtitle:
      "Admin can create all four meeting types and send citizen meets for approval flow.",
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
    userLookupFailed:
      "Unable to fetch user details for the provided mobile number",
    fetchingUserDetails: "Fetching user details...",
    cancel: "Cancel",
    createMeeting: "Create Meeting",
    typeConstituency: "Constituency Visit",
    typeDepartment: "Department Visit",
    typeCitizen: "Citizen Meet",
    typePersonal: "Personal Meet",
    typeParty: "Party Meet",
    typeOffice: "Office Meet",
    invitationType: "Invitation",
    invitationSubtype: "Invitation Type",
    selectInvitationSubtype: "Select invitation type",
    invitationMarriage: "Marriage",
    invitationBirthday: "Birthday",
    invitationFuneral: "Funeral",
    invitationOther: "Other",
    partyMeetDetails: "Party Office Details",
    enterPartyOfficeDetails: "Enter party office details",
    selectedStaff: "Select Staff Members",
    enterSelectedStaff: "Select staff members who will attend",
    noStaffAvailable: "No staff members available",
    priorityLow: "Low",
    priorityMedium: "Medium",
    priorityHigh: "High",
    priorityUrgent: "Urgent",
    giftToCarry: "Gift To Carry",
    enterGiftToCarry: "Enter gift details",
    selfDraftedLetter: "Self Drafted Letter",
    enterSelfDraftedLetter: "Enter drafted letter text",
    campHeadUser: "CAMP_HEAD User",
    selectCampHeadUser: "Select CAMP_HEAD user",
  },
  hi: {
    title: "बैठक बनाएँ",
    subtitle:
      "एडमिन चारों प्रकार की बैठक बना सकता है और नागरिक बैठक को अनुमोदन प्रक्रिया में भेज सकता है।",
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
    userLookupFailed:
      "दिए गए मोबाइल नंबर के लिए यूज़र विवरण प्राप्त नहीं हो सके",
    fetchingUserDetails: "यूज़र विवरण प्राप्त किए जा रहे हैं...",
    cancel: "रद्द करें",
    createMeeting: "बैठक बनाएँ",
    typeConstituency: "निर्वाचन क्षेत्र भ्रमण",
    typeDepartment: "विभागीय बैठक",
    typeCitizen: "नागरिक बैठक",
    typePersonal: "व्यक्तिगत बैठक",
    typeParty: "पार्टी बैठक",
    typeOffice: "कार्यालय बैठक",
    invitationType: "आमंत्रण",
    invitationSubtype: "आमंत्रण प्रकार",
    selectInvitationSubtype: "आमंत्रण प्रकार चुनें",
    invitationMarriage: "विवाह",
    invitationBirthday: "जन्मदिन",
    invitationFuneral: "अंतिम संस्कार",
    invitationOther: "अन्य",
    partyMeetDetails: "पार्टी कार्यालय विवरण",
    enterPartyOfficeDetails: "पार्टी कार्यालय विवरण दर्ज करें",
    selectedStaff: "कर्मचारी सदस्यों को चुनें",
    enterSelectedStaff: "कर्मचारी सदस्यों को चुनें जो उपस्थित होंगे",
    noStaffAvailable: "कोई कर्मचारी सदस्य उपलब्ध नहीं है",
    priorityLow: "निम्न",
    priorityMedium: "मध्यम",
    priorityHigh: "उच्च",
    priorityUrgent: "अत्यावश्यक",
    giftToCarry: "साथ ले जाने वाला उपहार",
    enterGiftToCarry: "उपहार विवरण दर्ज करें",
    selfDraftedLetter: "स्व-ड्राफ्टेड पत्र",
    enterSelfDraftedLetter: "ड्राफ्टेड पत्र दर्ज करें",
    campHeadUser: "CAMP_HEAD यूज़र",
    selectCampHeadUser: "CAMP_HEAD यूज़र चुनें",
  },
  pa: {
    title: "ਮੀਟਿੰਗ ਬਣਾਓ",
    subtitle:
      "ਐਡਮਿਨ ਸਾਰੀਆਂ ਚਾਰ ਕਿਸਮਾਂ ਦੀਆਂ ਮੀਟਿੰਗਾਂ ਬਣਾਕੇ ਨਾਗਰਿਕ ਮੀਟਿੰਗ ਨੂੰ ਮਨਜ਼ੂਰੀ ਪ੍ਰਕਿਰਿਆ ਵਿੱਚ ਭੇਜ ਸਕਦਾ ਹੈ।",
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
    typeParty: "ਪਾਰਟੀ ਮੀਟਿੰਗ",
    typeOffice: "ਦਫ਼ਤਰ ਮੀਟਿੰਗ",
    invitationType: "ਸੱਦਾ",
    invitationSubtype: "ਸੱਦਾ ਕਿਸਮ",
    selectInvitationSubtype: "ਸੱਦਾ ਕਿਸਮ ਚੁਣੋ",
    invitationMarriage: "ਵਿਆਹ",
    invitationBirthday: "ਜਨਮਦਿਨ",
    invitationFuneral: "ਲਈਂਦਾ",
    invitationOther: "ਹੋਰ",
    partyMeetDetails: "ਪਾਰਟੀ ਦਫ਼ਤਰ ਦੇ ਵੇਰਵੇ",
    enterPartyOfficeDetails: "ਪਾਰਟੀ ਦਫ਼ਤਰ ਦੇ ਵੇਰਵੇ ਦਰਜ ਕਰੋ",
    selectedStaff: "ਸਟਾਫ ਸਦੱਸਾਂ ਨੂੰ ਚੁਣੋ",
    enterSelectedStaff: "ਉਹ ਸਟਾਫ ਸਦੱਸੇ ਚੁਣੋ ਜੋ ਹਾਜਰ ਹੋਣਗੇ",
    noStaffAvailable: "ਕੋਈ ਸਟਾਫ ਸਦੱਸੇ ਉਪਲਬਧ ਨਹੀਂ",
    priorityLow: "ਘੱਟ",
    priorityMedium: "ਮੱਧਮ",
    priorityHigh: "ਉੱਚ",
    priorityUrgent: "ਤੁਰੰਤ",
    giftToCarry: "ਨਾਲ ਲੈ ਜਾਣ ਵਾਲਾ ਤੋਹਫ਼ਾ",
    enterGiftToCarry: "ਤੋਹਫ਼ੇ ਦਾ ਵੇਰਵਾ ਦਰਜ ਕਰੋ",
    selfDraftedLetter: "ਸਵੈ-ਡਰਾਫਟ ਕੀਤਾ ਪੱਤਰ",
    enterSelfDraftedLetter: "ਡਰਾਫਟ ਪੱਤਰ ਦਰਜ ਕਰੋ",
    campHeadUser: "CAMP_HEAD ਯੂਜ਼ਰ",
    selectCampHeadUser: "CAMP_HEAD ਯੂਜ਼ਰ ਚੁਣੋ",
  },
} as const;

const MEETING_TYPE_OPTIONS: Array<{ value: MEETINGTYPE }> = [
  { value: MEETINGTYPE.INVITATION },
  { value: MEETINGTYPE.CONSTITUENCY_VISIT },
  { value: MEETINGTYPE.DEPARTMENT_VISIT },
  { value: MEETINGTYPE.CITIZEN_MEET },
  { value: MEETINGTYPE.PERSONAL_MEET },
  { value: MEETINGTYPE.PARTY_MEET },
  { value: MEETINGTYPE.OFFICE_MEET },
];

const PRIORITY_OPTIONS: Array<{ value: MEETINGPRIORITY }> = [
  { value: MEETINGPRIORITY.LOW },
  { value: MEETINGPRIORITY.MEDIUM },
  { value: MEETINGPRIORITY.HIGH },
  { value: MEETINGPRIORITY.URGENT },
];

type FormValues = {
  assignedToUserId: string;
  campHeadUserId?: string;
  type: MEETINGTYPE;
  invitationSubtype?: INVITATIONSUBTYPE;
  giftToCarry?: string;
  selfDraftedLetter?: string;
  purpose: string;
  meetingDateTime?: { toISOString(): string };
  meetingPlace?: string;
  preferredDateTime?: { toISOString(): string };
  priority?: MEETINGPRIORITY;
  citizenName?: string;
  citizenMobile?: string;
  citizenArea?: string;
  citizenDetails?: string;
  contactName?: string;
  contactMobile?: string;
  contactDesignation?: string;
  contactDepartment?: string;
  partyMeetDetails?: string;
  selectedStaffNames?: string;
};

export default function CreateMeetingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = PAGE_COPY[language];
  const [form] = Form.useForm<FormValues>();
  const [users, setUsers] = useState<AdminMeetingAssignee[]>([]);
  const [selectedType, setSelectedType] = useState<FormValues["type"]>(
    MEETINGTYPE.CONSTITUENCY_VISIT,
  );
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [citizenDetailsLocked, setCitizenDetailsLocked] = useState(false);
  const [contactDetailsLocked, setContactDetailsLocked] = useState(false);
  const [staffMembers, setStaffMembers] = useState<AdminMeetingAssignee[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [message, setMessage] = useState<string>("");

  const reportUsers = users.filter(
    (user) =>
      user.role !== "OFFICER" &&
      user.role !== "ADMIN" &&
      user.role !== "CITIZEN",
  );
  const mobileRules = [
    { required: true },
    { pattern: /^\d{10}$/, message: copy.invalidMobile },
  ];

  const meetingTypeOptions = MEETING_TYPE_OPTIONS.map((option) => {
    const localizedLabel: Record<FormValues["type"], string> = {
      INVITATION: copy.invitationType,
      CONSTITUENCY_VISIT: copy.typeConstituency,
      DEPARTMENT_VISIT: copy.typeDepartment,
      CITIZEN_MEET: copy.typeCitizen,
      PERSONAL_MEET: copy.typePersonal,
      PARTY_MEET: copy.typeParty,
      OFFICE_MEET: copy.typeOffice,
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

  const invitationSubtypeOptions = [
    { value: INVITATIONSUBTYPE.MARRIAGE, label: copy.invitationMarriage },
    { value: INVITATIONSUBTYPE.BIRTHDAY, label: copy.invitationBirthday },
    { value: INVITATIONSUBTYPE.FUNERAL, label: copy.invitationFuneral },
    { value: INVITATIONSUBTYPE.OTHER, label: copy.invitationOther },
  ];

  const areaOptions = RAJOURI_GARDEN_AREAS.map((area) => ({
    value: area,
    label: area,
  }));

  function normalizeMobile(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  async function fetchUserByMobile(
    mobile: string,
    target: "citizen" | "contact",
  ) {
    if (mobile.length !== 10) {
      if (target === "citizen") {
        setCitizenDetailsLocked(false);
      } else {
        setContactDetailsLocked(false);
      }
      return;
    }

    setLoadingLookup(true);
    const shouldLookupOfficer =
      target === "contact" && selectedType === MEETINGTYPE.DEPARTMENT_VISIT;

    if (target === "citizen") {
      const result = await lookupAdminMeetingCitizenByMobileAction(mobile);
      setLoadingLookup(false);

      if (!result.ok) {
        setError(result.error ?? copy.userLookupFailed);
        return;
      }

      if (!result.found) {
        setCitizenDetailsLocked(false);
        return;
      }

      form.setFieldsValue({
        citizenName: result.user.name ?? form.getFieldValue("citizenName"),
        citizenArea: result.user.address ?? form.getFieldValue("citizenArea"),
      });
      setCitizenDetailsLocked(true);
      return;
    }

    const result = await lookupAdminMeetingContactByMobileAction(
      mobile,
      shouldLookupOfficer,
    );
    setLoadingLookup(false);

    if (!result.ok) {
      setError(result.error ?? copy.userLookupFailed);
      return;
    }

    if (!result.found) {
      if (shouldLookupOfficer) {
        setError(
          "No officer or contact found with this mobile number. You can enter the details manually.",
        );
      }
      form.setFieldsValue({
        contactName: undefined,
        contactDesignation: undefined,
        contactDepartment: undefined,
      });
      setContactDetailsLocked(false);
      return;
    }

    if (shouldLookupOfficer) {
      form.setFieldsValue({
        contactName: result.contact.name,
        contactDesignation: result.contact.designation ?? undefined,
        contactDepartment: result.contact.department ?? undefined,
      });
      setContactDetailsLocked(true);
    } else {
      form.setFieldsValue({
        contactName: result.contact.name,
      });
      setContactDetailsLocked(true);
    }
  }

  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      const result = await getAdminMeetingAssigneesAction();

      setLoadingUsers(false);

      if (!result.ok) {
        setError(result.error ?? copy.failedUsers);
        return;
      }

      setUsers(result.assignees ?? []);

      // Filter staff members (exclude CITIZEN and OFFICER)
      const staff = (result.assignees ?? []).filter(
        (user) =>
          user.role !== "CITIZEN" &&
          user.role !== "OFFICER" &&
          user.role !== "ADMIN",
      );
      setStaffMembers(staff);
    }

    void loadUsers();
  }, [copy.failedUsers]);

  async function onFinish(values: FormValues) {
    setSaving(true);
    const payload = {
      assignedToUserId: values.assignedToUserId,
      campHeadUserId: values.campHeadUserId,
      type: values.type,
      invitationSubtype: values.invitationSubtype,
      giftToCarry: values.giftToCarry,
      selfDraftedLetter: values.selfDraftedLetter,
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
      partyMeetDetails: values.partyMeetDetails,
      selectedStaffNames: Array.from(selectedStaff)
        .map((id) => staffMembers.find((s) => s.id === id)?.name)
        .filter((name) => name)
        .join(", "),
    };

    const result = await createAdminMeetingAction(payload);

    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? copy.failedCreate);
      return;
    }

    setMessage(copy.successCreate);
    setError("");
    form.resetFields();
    setSelectedType(MEETINGTYPE.CONSTITUENCY_VISIT);
    setCitizenDetailsLocked(false);
    setContactDetailsLocked(false);
    setSelectedStaff(new Set());
    setTimeout(() => {
      router.push("/admin");
    }, 600);
  }

  const isCitizenMeet = selectedType === MEETINGTYPE.CITIZEN_MEET;
  const isDepartmentVisit = selectedType === MEETINGTYPE.DEPARTMENT_VISIT;
  const isPartyMeet = selectedType === MEETINGTYPE.PARTY_MEET;
  const isOfficeMeet = selectedType === MEETINGTYPE.OFFICE_MEET;
  const isInvitation = selectedType === MEETINGTYPE.INVITATION;
  const showContactFields =
    selectedType === MEETINGTYPE.DEPARTMENT_VISIT ||
    selectedType === MEETINGTYPE.PERSONAL_MEET ||
    selectedType === MEETINGTYPE.PARTY_MEET;

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
                      options={invitationSubtypeOptions}
                      placeholder={copy.selectInvitationSubtype}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
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
            {isInvitation && (
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
                    options={reportUsers.map((user) => ({
                      label: `${user.name ?? "Unnamed User"} (${user.mobile})`,
                      value: user.id,
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
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
                    rules={[
                      { required: true, message: copy.selectMeetingDateTime },
                    ]}
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
                    rules={[
                      { required: true, message: copy.enterMeetingPlace },
                    ]}
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
                        rules={[
                          { required: true, message: copy.enterGiftToCarry },
                        ]}
                      >
                        <Input.TextArea
                          rows={2}
                          placeholder={copy.enterGiftToCarry}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        label={copy.selfDraftedLetter}
                        name="selfDraftedLetter"
                        rules={[
                          {
                            required: true,
                            message: copy.enterSelfDraftedLetter,
                          },
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
              </>
            )}

            {isCitizenMeet && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.preferredDateTime}
                    name="preferredDateTime"
                    rules={[
                      { required: true, message: copy.selectPreferredDateTime },
                    ]}
                  >
                    <DatePicker
                      showTime={{
                        use12Hours: true,
                        format: "hh:mm A",
                        minuteStep: 5,
                      }}
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
                      index === 0
                        ? { ...rule, message: copy.enterCitizenMobile }
                        : rule,
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
                    <Input
                      placeholder={copy.enterCitizenName}
                      disabled={citizenDetailsLocked}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.citizenArea}
                    name="citizenArea"
                    rules={[
                      { required: true, message: copy.selectCitizenArea },
                    ]}
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
                    rules={[
                      { required: true, message: copy.enterCitizenDetails },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder={copy.requestDetails}
                    />
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
                      index === 0
                        ? { ...rule, message: copy.enterContactMobile }
                        : rule,
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
                          if (selectedType === MEETINGTYPE.DEPARTMENT_VISIT) {
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
                    <Input
                      placeholder={copy.enterDesignation}
                      disabled={isDepartmentVisit}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={copy.department}
                    name="contactDepartment"
                    rules={[{ required: true, message: copy.enterDepartment }]}
                  >
                    <Input
                      placeholder={copy.enterDepartment}
                      disabled={isDepartmentVisit}
                    />
                  </Form.Item>
                </Col>
                {isPartyMeet && (
                  <Col xs={24}>
                    <Form.Item
                      label={copy.partyMeetDetails}
                      name="partyMeetDetails"
                      rules={[
                        {
                          required: true,
                          message: copy.enterPartyOfficeDetails,
                        },
                      ]}
                    >
                      <Input.TextArea
                        placeholder={copy.enterPartyOfficeDetails}
                        rows={3}
                      />
                    </Form.Item>
                  </Col>
                )}
              </>
            )}

            {isOfficeMeet && (
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{copy.selectedStaff}</Text>
                    </div>
                    <div
                      style={{
                        border: "1px solid #d9d9d9",
                        borderRadius: "4px",
                        padding: "8px",
                        maxHeight: "250px",
                        overflowY: "auto",
                      }}
                    >
                      {staffMembers.length === 0 ? (
                        <Text type="secondary">{copy.noStaffAvailable}</Text>
                      ) : (
                        <div>
                          {staffMembers.map((staff) => (
                            <div
                              key={staff.id}
                              style={{
                                padding: "6px",
                                marginBottom: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedStaff.has(staff.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedStaff);
                                  if (e.target.checked) {
                                    newSelected.add(staff.id);
                                  } else {
                                    newSelected.delete(staff.id);
                                  }
                                  setSelectedStaff(newSelected);
                                }}
                              />
                              <label style={{ marginBottom: 0, flex: 1 }}>
                                {staff.name} ({staff.role})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Text
                      type="secondary"
                      style={{ fontSize: "12px", marginTop: "4px" }}
                    >
                      {copy.enterSelectedStaff}
                    </Text>
                  </div>
                </Col>
              </Row>
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

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <Link href="/admin">
              <Button>{copy.cancel}</Button>
            </Link>
            <Button
              htmlType="submit"
              type="primary"
              loading={saving}
              style={{
                background: "#1a3c6e",
                borderColor: "#1a3c6e",
                fontWeight: 700,
              }}
            >
              {copy.createMeeting}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Divider, Spin, Table, Tag, Typography, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import type { TableColumnsType } from "antd";
import type { RcFile } from "antd/es/upload/interface";
import { FormProvider, Resolver, useForm, useWatch } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useLanguage } from "@/components/provider/language_provider";
import { OptionValue } from "@/model/main";
import {
  RAJOURI_GARDEN_AREAS,
} from "@/lib/constants";
import {
  addCampComplaintMediaAction,
  CitizenComplaintListItem,
  createCampComplaintAction,
  getCitizenComplaintsByMobileAction,
  getCitizenComplaintSummaryAction,
  getCitizenByMobileAction,
} from "@/actions/camp";
import {
  CategoryWithSubcategories,
  getCategoriesWithSubcategoriesAction,
} from "@/actions/user/getCategoriesAction";
import {
  campComplaintValidationForm,
  campComplaintValidationSchema,
} from "@/schema/campComplaintValidationSchema";
import { CustomMultiSelect } from "@/components/inputfields/multiselect";
import { CustomTextAreaInput } from "@/components/inputfields/textareainput";
import { CustomTextInput } from "@/components/inputfields/textinput";
import { onFormError } from "@/utils/method";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_COUNT = 10;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  WORK_IN_PROGRESS: "cyan",
  QUERY_RAISED: "volcano",
  RESOLVED: "green",
  REJECTED: "red",
  ESCALATED: "purple",
  CLOSED: "default",
  AUTO_CLOSED: "default",
};

export default function CampNewComplaintForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [citizenFound, setCitizenFound] = useState<null | boolean>(null);
  const [citizenFieldsLocked, setCitizenFieldsLocked] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintSummary, setComplaintSummary] = useState<{
    total: number;
    resolved: number;
    pending: number;
    closed: number;
  } | null>(null);
  const [citizenComplaints, setCitizenComplaints] = useState<
    CitizenComplaintListItem[]
  >([]);
  const [mediaFiles, setMediaFiles] = useState<UploadFile[]>([]);
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);

  const uploadProps: UploadProps = {
    accept: "image/*",
    multiple: true,
    fileList: mediaFiles,
    disabled: loading,
    showUploadList: {
      showPreviewIcon: false,
    },
    beforeUpload: (file) => {
      if (!file.type.startsWith("image/")) {
        setAlert({ type: "error", text: "Only image files are allowed." });
        return Upload.LIST_IGNORE;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setAlert({ type: "error", text: "Each image must be 2 MB or smaller." });
        return Upload.LIST_IGNORE;
      }

      return false;
    },
    onChange: ({ fileList }) => {
      const limitedFiles = fileList.slice(0, MAX_IMAGE_COUNT);
      if (fileList.length > MAX_IMAGE_COUNT) {
        setAlert({ type: "error", text: "You can upload up to 10 images." });
      }
      setMediaFiles(limitedFiles);
    },
  };

  async function uploadComplaintMedia(complaintId: number) {
    const files: RcFile[] = mediaFiles.flatMap((item) =>
      item.originFileObj ? [item.originFileObj] : [],
    );

    if (files.length === 0) {
      return { ok: true };
    }

    const formData = new FormData();
    formData.append("complaintId", String(complaintId));
    for (const file of files) {
      formData.append("files", file);
    }

    return addCampComplaintMediaAction(formData);
  }

  const methods = useForm<campComplaintValidationForm>({
    defaultValues: {
      mobile: "",
      name: "",
      address: "",
      aadhaar: "",
      voterId: "",
      categoryId: "0",
      subcategoryId: "0",
      description: "",
      complaintAddress: "",
      affectedCitizensCount: "1",
      area: "",
      lat: "",
      lng: "",
    },
    resolver: valibotResolver(
      campComplaintValidationSchema,
    ) as Resolver<campComplaintValidationForm>,
  });

  const {
    handleSubmit,
    setValue,
    setFocus,
    getValues,
    reset,
    formState: { errors },
  } = methods;

  const selectedCategoryIdRaw = useWatch({ control: methods.control, name: "categoryId" });
  const selectedSubcategoryIdRaw = useWatch({ control: methods.control, name: "subcategoryId" });
  const watchedName = useWatch({ control: methods.control, name: "name" });
  const watchedAddress = useWatch({ control: methods.control, name: "address" });
  const watchedVoterId = useWatch({ control: methods.control, name: "voterId" });
  
  const selectedCategoryId: string = String(selectedCategoryIdRaw || "0");
  const selectedSubcategoryId: string = String(selectedSubcategoryIdRaw || "0");
  const citizenMissingBasicInfo =
    citizenFound === true &&
    (!(watchedName ?? "").trim() ||
      !(watchedAddress ?? "").trim() ||
      !(watchedVoterId ?? "").trim());

  const complaintColumns: TableColumnsType<CitizenComplaintListItem> = [
    {
      title: t("dashboard.table.refNo"),
      dataIndex: "id",
      key: "id",
      width: 92,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: t("dashboard.table.category"),
      dataIndex: "category",
      key: "category",
      width: 140,
    },
    {
      title: t("newComplaint.subcategory"),
      dataIndex: "subcategory",
      key: "subcategory",
      width: 140,
      render: (value: string | null) => value ?? "-",
    },
    {
      title: t("dashboard.table.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? "default"}>
          {status.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: t("dashboard.table.filedOn"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString("en-IN"),
    },
    {
      title: t("dashboard.table.action"),
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => router.push(`/camp/complaints/${record.id}`)}
          style={{ borderColor: "#1a3c6e", color: "#1a3c6e" }}
        >
          {t("mlaCluster.view")}
        </Button>
      ),
    },
  ];

  // Load categories on mount
  useEffect(() => {
    let disposed = false;

    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const result = await getCategoriesWithSubcategoriesAction();
        if (!disposed && result.ok) {
          setCategories(result.categories);
          
          // Set default category and subcategory
          if (result.categories.length > 0) {
            const firstCategory = result.categories[0];
            setValue("categoryId", String(firstCategory.id));
            if (firstCategory.subcategories.length > 0) {
              setValue("subcategoryId", String(firstCategory.subcategories[0].id));
            }
          }
        }
      } finally {
        if (!disposed) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      disposed = true;
    };
  }, [setValue]);

  // Find the selected category object
  const selectedCategoryObj: CategoryWithSubcategories | undefined = categories.find(
    (cat) => cat.id === Number(selectedCategoryId)
  );

  const categoryOptions: OptionValue[] = categories.map((category) => ({
    value: String(category.id),
    label: category.name,
  }));

  const subcategoryOptions: OptionValue[] = (
    selectedCategoryObj?.subcategories ?? []
  ).map((subcategory) => ({
    value: String(subcategory.id),
    label: subcategory.name,
  }));

  const areaOptions: OptionValue[] = RAJOURI_GARDEN_AREAS.map((area) => ({
    value: area,
    label: area,
  }));

  useEffect(() => {
    if (!selectedCategoryObj) return;
    
    const allowedSubcategoryIds = selectedCategoryObj.subcategories.map((s: { id: number; name: string }) => String(s.id));
    const currentSubcategoryId = String(selectedSubcategoryId || "0");
    if (!allowedSubcategoryIds.includes(currentSubcategoryId)) {
      setValue("subcategoryId", allowedSubcategoryIds[0] ?? "0", {
        shouldValidate: true,
      });
    }
  }, [selectedCategoryId, selectedSubcategoryId, selectedCategoryObj, setValue]);

  function handleFillBasicDetails() {
    setCitizenFieldsLocked(false);

    const name = (getValues("name") ?? "").trim();
    const address = (getValues("address") ?? "").trim();
    const voterId = (getValues("voterId") ?? "").trim();

    if (!name) {
      setFocus("name");
      return;
    }

    if (!address) {
      setFocus("address");
      return;
    }

    if (!voterId) {
      setFocus("voterId");
      return;
    }

    setFocus("name");
  }

  function pickLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setAlert({ type: "error", text: t("newComplaint.error.geoUnsupported") });
      return;
    }

    setAlert(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("lat", position.coords.latitude.toFixed(6), {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("lng", position.coords.longitude.toFixed(6), {
          shouldValidate: true,
          shouldDirty: true,
        });
      },
      () => {
        setAlert({ type: "error", text: t("newComplaint.error.geoDetect") });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  async function lookupCitizen() {
    const mobile = getValues("mobile");

    if (!/^\d{10}$/.test((mobile ?? "").trim())) {
      setAlert({ type: "error", text: t("login.validation.mobileInvalid") });
      return;
    }

    setLookupLoading(true);
    setAlert(null);

    const result = await getCitizenByMobileAction(mobile);

    setLookupLoading(false);

    if (!result.ok) {
      setCitizenFound(null);
      setCitizenFieldsLocked(false);
      setComplaintSummary(null);
      setCitizenComplaints([]);
      setAlert({ type: "error", text: result.error });
      return;
    }

    if (!result.found) {
      setCitizenFound(false);
      setCitizenFieldsLocked(false);
      setComplaintSummary(null);
      setCitizenComplaints([]);
      setValue("name", "");
      setValue("address", "");
      setValue("aadhaar", "");
      setValue("voterId", "");
      setAlert({ type: "info", text: t("camp.lookup.notFound") });
      return;
    }

    setCitizenFound(true);
    const missingBasicInfo =
      !result.user.name.trim() ||
      !result.user.address.trim() ||
      !result.user.voterId.trim();

    setCitizenFieldsLocked(!missingBasicInfo);
    setValue("name", result.user.name, { shouldValidate: true });
    setValue("address", result.user.address, { shouldValidate: true });
    setValue("aadhaar", result.user.aadhaar, { shouldValidate: true });
    setValue("voterId", result.user.voterId, { shouldValidate: true });
    setAlert({
      type: missingBasicInfo ? "info" : "success",
      text: missingBasicInfo ? t("camp.lookup.basicMissing") : t("camp.lookup.found"),
    });

    setSummaryLoading(true);
    setComplaintsLoading(true);
    const [summaryResult, complaintsResult] = await Promise.all([
      getCitizenComplaintSummaryAction(mobile),
      getCitizenComplaintsByMobileAction(mobile),
    ]);
    setSummaryLoading(false);
    setComplaintsLoading(false);

    if (summaryResult.ok && summaryResult.found) {
      setComplaintSummary(summaryResult.summary);
    } else {
      setComplaintSummary(null);
    }

    if (complaintsResult.ok && complaintsResult.found) {
      setCitizenComplaints(complaintsResult.complaints);
    } else {
      setCitizenComplaints([]);
    }
  }

  async function onSubmit(values: campComplaintValidationForm) {
    setLoading(true);
    setAlert(null);

    const result = await createCampComplaintAction({
      citizen: {
        mobile: values.mobile,
        name: values.name ?? "",
        address: values.address ?? "",
        aadhaar: values.aadhaar,
        voterId: values.voterId ?? "",
      },
      complaint: {
        categoryId: Number(values.categoryId),
        subcategoryId: Number(values.subcategoryId),
        description: values.description,
        complaintAddress: values.complaintAddress,
        affectedCitizensCount: values.affectedCitizensCount,
        area: values.area,
        lat: values.lat,
        lng: values.lng,
      },
    });

    if (!result.ok) {
      setLoading(false);
      setAlert({ type: "error", text: result.error });
      return;
    }

    if (result.complaintId && mediaFiles.length > 0) {
      const uploadResult = await uploadComplaintMedia(result.complaintId);

      if (!uploadResult.ok) {
        setLoading(false);
        setAlert({
          type: "error",
          text: `Complaint #${result.complaintId} submitted, but image upload failed. ${uploadResult.error ?? "Please try again."}`,
        });
        return;
      }
    }

    setLoading(false);

    setAlert({
      type: "success",
      text: result.createdNewUser
        ? `${t("camp.create.success")} #${result.complaintId}. ${t("camp.create.userCreated")}`
        : `${t("camp.create.success")} #${result.complaintId}. ${t("camp.create.userUpdated")}`,
    });

    if (result.clusterId) {
      setAlert({
        type: "success",
        text:
          (result.createdNewUser
            ? `${t("camp.create.success")} #${result.complaintId}. ${t("camp.create.userCreated")}`
            : `${t("camp.create.success")} #${result.complaintId}. ${t("camp.create.userUpdated")}`) +
          ` Cluster: ${result.clusterId} (${result.clusterComplaintCount ?? 1} complaints)`,
      });
    }

    setCitizenFound(null);
    setCitizenFieldsLocked(false);
    setComplaintSummary(null);
    setCitizenComplaints([]);
    
    // Reset form with first category and subcategory
    const firstCategory = categories[0];
    reset({
      mobile: "",
      name: "",
      address: "",
      aadhaar: "",
      voterId: "",
      categoryId: String(firstCategory?.id ?? 0),
      subcategoryId: String(firstCategory?.subcategories[0]?.id ?? 0),
      description: "",
      complaintAddress: "",
      affectedCitizensCount: "1",
      area: "",
      lat: "",
      lng: "",
    });
    setMediaFiles([]);
    router.push(`/camp/complaints/${result.complaintId}`);
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #12294a 0%, #1a3c6e 100%)",
          borderRadius: "6px 6px 0 0",
          padding: "24px 28px",
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0, letterSpacing: "0.02em" }}>
          {t("camp.new.title")}
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, display: "block", marginTop: 4 }}>
          {t("camp.new.subtitle")}
        </Text>
      </div>

      <Card
        style={{
          borderRadius: "0 0 6px 6px",
          borderTop: 0,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}
      >
        {loadingCategories ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Spin size="large" description="Loading categories..." />
          </div>
        ) : (
          <>
            {alert && (
              <Alert
                type={alert.type}
                title={alert.text}
                showIcon
                closable
                style={{ marginBottom: 24 }}
                onClose={() => setAlert(null)}
              />
            )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit, onFormError)}>
            <Divider>{t("camp.citizen.section")}</Divider>

            <div className="mb-3" style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "nowrap", width: "100%" }}>
              <div style={{ flex: "1.3 1 0" }}>
                <CustomTextInput<campComplaintValidationForm>
                  name="mobile"
                  title={t("camp.citizen.mobile")}
                  placeholder={t("login.mobilePlaceholder")}
                  required
                  onlynumber
                  maxlength={10}
                  disable={citizenFieldsLocked}
                />
              </div>
              <div style={{ flex: "0.9 1 0", paddingTop: 20 }}>
                <Button
                  block
                  size="medium"
                  loading={lookupLoading}
                  onClick={() => {
                    void lookupCitizen();
                  }}
                  style={{
                    borderColor: "#1a3c6e",
                    color: "#1a3c6e",
                    fontWeight: 700,
                  }}
                >
                  {t("camp.lookup.button")}
                </Button>
              </div>
              <div style={{ flex: "1.4 1 0" }}>
              <CustomTextInput<campComplaintValidationForm>
                name="name"
                title={t("register.nameLabel")}
                placeholder={t("register.namePlaceholder")}
                maxlength={120}
                disable={citizenFieldsLocked}
              />
              </div>

              <div style={{ flex: "1 1 0" }}>
                <CustomTextInput<campComplaintValidationForm>
                  name="aadhaar"
                  title={t("register.aadhaarLabel")}
                  placeholder={t("register.aadhaarPlaceholder")}
                  onlynumber
                  maxlength={12}
                  disable={citizenFieldsLocked}
                />
              </div>

              <div style={{ flex: "1 1 0" }}>
                <CustomTextInput<campComplaintValidationForm>
                  name="voterId"
                  title={t("register.voterIdLabel")}
                  placeholder={t("register.voterIdPlaceholder")}
                  maxlength={30}
                  disable={citizenFieldsLocked}
                />
              </div>
              </div>
            </div>

            <div className="mb-3">
              <CustomTextAreaInput<campComplaintValidationForm>
                name="address"
                title={t("register.addressLabel")}
                placeholder={t("register.addressPlaceholder")}
                required={false}
                maxlength={500}
                disable={citizenFieldsLocked}
              />
            </div>

            {citizenFieldsLocked && (
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("camp.lookup.locked")}
                </Text>
                <Button
                  size="small"
                  type="default"
                  onClick={() => setCitizenFieldsLocked(false)}
                >
                  {t("camp.lookup.change")}
                </Button>
              </div>
            )}

            {citizenFound && citizenMissingBasicInfo && (
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Text type="warning" style={{ fontSize: 12 }}>
                  {t("camp.lookup.basicMissing")}
                </Text>
                <Button
                  size="small"
                  type="primary"
                  onClick={handleFillBasicDetails}
                >
                  {t("camp.lookup.fillBasic")}
                </Button>
              </div>
            )}

            {citizenFound === false && (
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("camp.lookup.notFound")}
                </Text>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    setCitizenFieldsLocked(false);
                    setFocus("name");
                  }}
                >
                  {t("camp.lookup.addDetails")}
                </Button>
              </div>
            )}

            <Divider>{t("camp.complaint.section")}</Divider>

            <div className="mb-3" style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "nowrap", width: "100%" }}>
              <div style={{ flex: "1 1 0" }}>
                <CustomMultiSelect<campComplaintValidationForm>
                  name="categoryId"
                  title={t("newComplaint.category")}
                  placeholder={t("newComplaint.validation.category")}
                  required
                  options={categoryOptions}
                />
              </div>

              <div style={{ flex: "1 1 0" }}>
                <CustomMultiSelect<campComplaintValidationForm>
                  name="subcategoryId"
                  title={t("newComplaint.subcategory")}
                  placeholder={t("newComplaint.validation.subcategory")}
                  required
                  options={subcategoryOptions}
                />
              </div>

              <div style={{ flex: "1 1 0" }}>
                <CustomTextInput<campComplaintValidationForm>
                  name="affectedCitizensCount"
                  title={t("newComplaint.affectedCitizensCount")}
                  placeholder="e.g. 12"
                  required
                  onlynumber
                />
              </div>
              </div>
            </div>

            <div className="mb-3">
              <CustomTextAreaInput<campComplaintValidationForm>
                name="description"
                title={t("newComplaint.description")}
                placeholder={t("newComplaint.descriptionPlaceholder")}
                required
                maxlength={1000}
              />
            </div>

            <div className="mb-3">
              <CustomTextAreaInput<campComplaintValidationForm>
                name="complaintAddress"
                title="Address"
                placeholder="Enter complete address (e.g., House No. 123, Street Name, Area, City)"
                required
                maxlength={500}
              />
            </div>

            <div className="mb-3" style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "nowrap", width: "100%" }}>
              <div style={{ flex: "1.4 1 0" }}>
                <CustomMultiSelect<campComplaintValidationForm>
                  name="area"
                  title={t("newComplaint.area")}
                  placeholder={t("newComplaint.areaPlaceholder")}
                  required={false}
                  options={areaOptions}
                />
                {errors.area && (
                  <p className="text-xs text-red-500">{errors.area.message?.toString()}</p>
                )}
              </div>

              <div style={{ flex: "1 1 0" }}>
                <CustomTextInput<campComplaintValidationForm>
                  name="lat"
                  title={t("newComplaint.latitude")}
                  placeholder="e.g. 28.6139"
                  required
                  numdes
                />
              </div>

              <div style={{ flex: "1 1 0" }}>
                <CustomTextInput<campComplaintValidationForm>
                  name="lng"
                  title={t("newComplaint.longitude")}
                  placeholder="e.g. 77.2090"
                  required
                  numdes
                />
              </div>

              <div style={{ flex: "0.9 1 0", paddingTop: 20 }}>
                <Button
                  block
                  size="medium"
                  onClick={pickLocation}
                  style={{
                    borderColor: "#1a3c6e",
                    color: "#1a3c6e",
                    fontWeight: 600,
                  }}
                >
                  {t("newComplaint.autoDetect")}
                </Button>
              </div>
              </div>
            </div>

            <Divider plain style={{ fontSize: 13, color: "#888", margin: "4px 0 16px" }}>
              Complaint Images
            </Divider>

            <div style={{ marginBottom: 16 }}>
              <Dragger {...uploadProps} listType="picture" maxCount={MAX_IMAGE_COUNT}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: "#1a3c6e" }} />
                </p>
                <p className="ant-upload-text">Click or drag images to this area to upload</p>
                <p className="ant-upload-hint">Supports multiple images. Each image must be 2 MB or smaller.</p>
              </Dragger>
              <Text style={{ color: "#666", fontSize: 12, display: "block", marginTop: 6 }}>
                {mediaFiles.length}/{MAX_IMAGE_COUNT} selected
              </Text>
            </div>

            {citizenFound !== null && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {citizenFound ? t("camp.lookup.willUpdate") : t("camp.lookup.willCreate")}
              </Text>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 h-11.5 w-full rounded bg-[#1a3c6e] text-[15px] font-bold text-white transition hover:bg-[#16335d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("camp.create.button")}
            </button>
          </form>
        </FormProvider>
          </div>

          <div className="xl:col-span-4">
            <Card
              size="small"
              style={{
                background: "#f8fbff",
                border: "1px solid #d6e4f5",
                position: "sticky",
                top: 16,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <Text strong>{t("camp.lookup.summaryTitle")}</Text>
                {(summaryLoading || complaintsLoading) && <Spin size="small" />}
              </div>

              {citizenFound === null && (
                <Text type="secondary">{t("camp.lookup.summaryHint")}</Text>
              )}

              {citizenFound === false && (
                <Text type="secondary">{t("camp.lookup.notFound")}</Text>
              )}

              {citizenFound && (
                <>
                  <div className="mb-4" style={{ display: "flex", gap: 8, flexWrap: "nowrap", overflowX: "auto" }}>
                    <Card size="small" bodyStyle={{ padding: 8 }} style={{ minWidth: 88, flex: "1 0 0" }}>
                      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                        {t("camp.lookup.summary.total")}
                      </Text>
                      <Text strong style={{ fontSize: 16 }}>
                        {complaintSummary?.total ?? 0}
                      </Text>
                    </Card>
                    <Card size="small" bodyStyle={{ padding: 8 }} style={{ minWidth: 88, flex: "1 0 0" }}>
                      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                        {t("camp.lookup.summary.resolved")}
                      </Text>
                      <Text strong style={{ fontSize: 16, color: "#1f8a34" }}>
                        {complaintSummary?.resolved ?? 0}
                      </Text>
                    </Card>
                    <Card size="small" bodyStyle={{ padding: 8 }} style={{ minWidth: 88, flex: "1 0 0" }}>
                      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                        {t("camp.lookup.summary.pending")}
                      </Text>
                      <Text strong style={{ fontSize: 16, color: "#b26a00" }}>
                        {complaintSummary?.pending ?? 0}
                      </Text>
                    </Card>
                    <Card size="small" bodyStyle={{ padding: 8 }} style={{ minWidth: 88, flex: "1 0 0" }}>
                      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                        {t("camp.lookup.summary.closed")}
                      </Text>
                      <Text strong style={{ fontSize: 16 }}>
                        {complaintSummary?.closed ?? 0}
                      </Text>
                    </Card>
                  </div>

                  <Divider style={{ margin: "10px 0" }} />
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    {t("camp.lookup.historyTitle")}
                  </Text>
                  <Table<CitizenComplaintListItem>
                    columns={complaintColumns}
                    dataSource={citizenComplaints}
                    loading={complaintsLoading}
                    rowKey="id"
                    pagination={{ pageSize: 5, showSizeChanger: false }}
                    size="small"
                    scroll={{ x: 650 }}
                  />
                </>
              )}
            </Card>
          </div>
        </div>
        </>
        )}
      </Card>
    </div>
  );
}

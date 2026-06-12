"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Divider,
  Spin,
  Typography,
} from "antd";
import { FormProvider, Resolver, useForm, useWatch } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useLanguage } from "@/components/provider/language_provider";
import {
  RAJOURI_GARDEN_AREAS,
} from "@/lib/constants";
import { addComplaintAction } from "@/actions/user/complaint";
import {
  CategoryWithSubcategories,
  getCategoriesWithSubcategoriesAction,
} from "@/actions/user/getCategoriesAction";
import {
  complaintValidationForm,
  complaintValidationSchema,
} from "@/schema/complaintValidationSchema";
import { CustomMultiSelect } from "@/components/inputfields/multiselect";
import { CustomTextAreaInput } from "@/components/inputfields/textareainput";
import { CustomTextInput } from "@/components/inputfields/textinput";
import { onFormError } from "@/utils/method";
import { OptionValue } from "@/model/main";

const { Title, Text } = Typography;

export default function AddComplaintForm() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const methods = useForm<complaintValidationForm>({
    defaultValues: {
      category: "",
      subcategory: "",
      description: "",
      area: "",
      lat: "",
      lng: "",
    },
    resolver: valibotResolver(
      complaintValidationSchema,
    ) as Resolver<complaintValidationForm>,
  });

  const {
    handleSubmit,
    setValue,
    reset,
  } = methods;

  const selectedCategory =
    useWatch({ control: methods.control, name: "category" }) || "";
  const selectedSubcategory =
    useWatch({ control: methods.control, name: "subcategory" }) || "";
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

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
            setValue("category", firstCategory.name);
            if (firstCategory.subcategories.length > 0) {
              setValue("subcategory", firstCategory.subcategories[0].name);
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
  const selectedCategoryObj = categories.find(
    (cat) => cat.name === selectedCategory
  );

  const categoryOptions: OptionValue[] = categories.map((category) => ({
    value: category.name,
    label: category.name,
  }));

  const subcategoryOptions: OptionValue[] = (
    selectedCategoryObj?.subcategories ?? []
  ).map((subcategory) => ({
    value: subcategory.name,
    label: subcategory.name,
  }));

  const areaOptions: OptionValue[] = RAJOURI_GARDEN_AREAS.map((area) => ({
    value: area,
    label: area,
  }));

  useEffect(() => {
    if (!selectedCategoryObj) return;
    
    const allowedSubcategories = selectedCategoryObj.subcategories.map(s => s.name);
    if (!allowedSubcategories.includes(selectedSubcategory)) {
      setValue("subcategory", allowedSubcategories[0] ?? "", {
        shouldValidate: true,
      });
    }
  }, [selectedCategory, selectedSubcategory, selectedCategoryObj, setValue]);

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

  async function onSubmit(values: complaintValidationForm) {
    setSubmitting(true);
    setAlert(null);

    try {
      const result = await addComplaintAction(values);

      if (!result.ok) {
        setAlert({
          type: "error",
          text: result.error ?? t("newComplaint.error.submit"),
        });
        return;
      }

      setAlert({
        type: "success",
        text: `${t("newComplaint.success.prefix")} #${result.complaintId} ${t("newComplaint.success.suffix")}`,
      });

      // Reset form with first category and subcategory
      const firstCategory = categories[0];
      reset({
        category: firstCategory?.name ?? "",
        subcategory: firstCategory?.subcategories[0]?.name ?? "",
        description: "",
        area: "",
        lat: "",
        lng: "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #12294a 0%, #1a3c6e 100%)",
          borderRadius: "6px 6px 0 0",
          padding: "24px 28px",
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0, letterSpacing: "0.02em" }}>
          {t("newComplaint.title")}
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, display: "block", marginTop: 4 }}>
          {t("newComplaint.subtitle")} <Text style={{ color: "#FF9933" }}>*</Text>
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
            <Spin size="large" tip="Loading categories..." />
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

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit, onFormError)}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <CustomMultiSelect<complaintValidationForm>
                  name="category"
                  title={t("newComplaint.category")}
                  placeholder={t("newComplaint.validation.category")}
                  required
                  options={categoryOptions}
                />
              </div>

              <div>
                <CustomMultiSelect<complaintValidationForm>
                  name="subcategory"
                  title={t("newComplaint.subcategory")}
                  placeholder={t("newComplaint.validation.subcategory")}
                  required
                  options={subcategoryOptions}
                />
              </div>
            </div>

            <div className="mb-3">
              <CustomTextAreaInput<complaintValidationForm>
                name="description"
                title={t("newComplaint.description")}
                placeholder={t("newComplaint.descriptionPlaceholder")}
                required
                maxlength={1000}
              />
            </div>

            <div className="mb-3">
              <CustomMultiSelect<complaintValidationForm>
                name="area"
                title={t("newComplaint.area")}
                placeholder={t("newComplaint.areaPlaceholder")}
                required={false}
                options={areaOptions}
              />
            </div>

            <Divider plain style={{ fontSize: 13, color: "#888", margin: "4px 0 16px" }}>
              {t("newComplaint.gps")}
            </Divider>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <CustomTextInput<complaintValidationForm>
                  name="lat"
                  title={t("newComplaint.latitude")}
                  placeholder="e.g. 28.6139"
                  required
                  numdes
                />
              </div>
              <div>
                <CustomTextInput<complaintValidationForm>
                  name="lng"
                  title={t("newComplaint.longitude")}
                  placeholder="e.g. 77.2090"
                  required
                  numdes
                />
              </div>
              <div className="pt-6">
                <Button
                  block
                  size="large"
                  icon={<span>📍</span>}
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

            <div style={{ marginTop: 8 }}>
              <Button
                type="primary"
                size="large"
                block
                htmlType="submit"
                loading={submitting}
                style={{
                  background: "#1a3c6e",
                  borderColor: "#1a3c6e",
                  height: 46,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {t("newComplaint.submit")}
              </Button>
            </div>
          </form>
        </FormProvider>
        </>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Alert, Card, Drawer, Input, Typography } from "antd";
import { Resolver, FormProvider, useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useLanguage } from "@/components/provider/language_provider";
import {
  registerValidationForm,
  registerValidationSchema,
} from "@/schema/registerValidationSchema";
import { CustomTextAreaInput } from "@/components/inputfields/textareainput";
import { CustomTextInput } from "@/components/inputfields/textinput";
import { onFormError } from "@/utils/method";
import { updateProfileAction } from "@/actions/user/profile";

const { Title, Text } = Typography;

type UserProfileFormProps = {
  profile: {
    name: string;
    address: string;
    aadhaar: string;
    voterId: string;
    mobile: string;
  };
};

export default function UserProfileForm({ profile }: UserProfileFormProps) {
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const methods = useForm<registerValidationForm>({
    defaultValues: {
      name: currentProfile.name,
      address: currentProfile.address,
      aadhaar: currentProfile.aadhaar,
      voterId: currentProfile.voterId,
    },
    resolver: valibotResolver(
      registerValidationSchema,
    ) as Resolver<registerValidationForm>,
  });

  const { handleSubmit, reset } = methods;

  async function onSubmit(values: registerValidationForm) {
    setLoading(true);
    setAlert(null);

    const result = await updateProfileAction({
      name: values.name,
      address: values.address,
      aadhaar: values.aadhaar,
      voterId: values.voterId,
    });

    setLoading(false);

    if (!result.ok) {
      setAlert({
        type: "error",
        text: result.error ?? t("profile.error.update"),
      });
      return;
    }

    setAlert({
      type: "success",
      text: t("profile.success.update"),
    });

    setCurrentProfile((previous) => ({
      ...previous,
      name: values.name,
      address: values.address,
      aadhaar: values.aadhaar ?? "",
      voterId: values.voterId,
    }));
    setDrawerOpen(false);
  }

  function openEditDrawer() {
    reset({
      name: currentProfile.name,
      address: currentProfile.address,
      aadhaar: currentProfile.aadhaar,
      voterId: currentProfile.voterId,
    });
    setDrawerOpen(true);
  }

  function closeEditDrawer() {
    reset({
      name: currentProfile.name,
      address: currentProfile.address,
      aadhaar: currentProfile.aadhaar,
      voterId: currentProfile.voterId,
    });
    setDrawerOpen(false);
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <Card className="shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
        <Title level={4} style={{ marginTop: 0, color: "#1a3c6e" }}>
          {t("profile.title")}
        </Title>
        <Text style={{ color: "#6c757d", display: "block", marginBottom: 20 }}>
          {t("profile.subtitle")}
        </Text>

        {alert && (
          <Alert
            type={alert.type}
            title={alert.text}
            showIcon
            closable
            style={{ marginBottom: 20 }}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-semibold text-[#1a3c6e]">{t("register.nameLabel")}</p>
            <p className="text-sm text-[#2f3b4d]">{currentProfile.name || "-"}</p>
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-[#1a3c6e]">{t("profile.contactLabel")}</p>
            <p className="text-sm text-[#2f3b4d]">{currentProfile.mobile || "-"}</p>
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-[#1a3c6e]">{t("register.aadhaarLabel")}</p>
            <p className="text-sm text-[#2f3b4d]">{currentProfile.aadhaar || "-"}</p>
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-[#1a3c6e]">{t("register.voterIdLabel")}</p>
            <p className="text-sm text-[#2f3b4d]">{currentProfile.voterId || "-"}</p>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-1 text-sm font-semibold text-[#1a3c6e]">{t("register.addressLabel")}</p>
            <p className="text-sm text-[#2f3b4d]">{currentProfile.address || "-"}</p>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 h-11.5 w-full rounded bg-[#1a3c6e] text-[15px] font-bold text-white transition hover:bg-[#16335d]"
          onClick={openEditDrawer}
        >
          {t("profile.editButton")}
        </button>

        <Drawer
          title={t("profile.editButton")}
          open={drawerOpen}
          size={520}
          onClose={closeEditDrawer}
          destroyOnClose
        >
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit, onFormError)}>
              <div className="grid grid-cols-1 gap-4">
                <div className="mb-3">
                  <CustomTextInput<registerValidationForm>
                    name="name"
                    title={t("register.nameLabel")}
                    placeholder={t("register.namePlaceholder")}
                    required
                    maxlength={120}
                  />
                </div>

                <div className="mb-3">
                  <CustomTextInput<registerValidationForm>
                    name="aadhaar"
                    title={t("register.aadhaarLabel")}
                    placeholder={t("register.aadhaarPlaceholder")}
                    onlynumber
                    maxlength={12}
                  />
                </div>

                <div className="mb-3">
                  <CustomTextInput<registerValidationForm>
                    name="voterId"
                    title={t("register.voterIdLabel")}
                    placeholder={t("register.voterIdPlaceholder")}
                    required
                    maxlength={30}
                  />
                </div>

                <div className="mb-3">
                  <CustomTextAreaInput<registerValidationForm>
                    name="address"
                    title={t("register.addressLabel")}
                    placeholder={t("register.addressPlaceholder")}
                    required
                    maxlength={500}
                  />
                </div>

                <div className="mb-3">
                  <label className="text-sm font-normal">{t("profile.contactLabel")}</label>
                  <Input value={currentProfile.mobile} disabled className="w-full" />
                  <p className="text-xs text-red-500">{t("profile.contactLocked")}</p>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="h-11.5 w-full rounded border border-[#1a3c6e] bg-white text-[15px] font-bold text-[#1a3c6e] transition hover:bg-[#f0f4fa]"
                  onClick={closeEditDrawer}
                >
                  {t("profile.cancelButton")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11.5 w-full rounded bg-[#1a3c6e] text-[15px] font-bold text-white transition hover:bg-[#16335d] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {t("profile.saveButton")}
                </button>
            </div>

            </form>
          </FormProvider>
        </Drawer>
      </Card>
    </div>
  );
}

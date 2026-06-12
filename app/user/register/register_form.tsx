"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Typography, Alert } from "antd";
import { useLanguage } from "@/components/provider/language_provider";
import { FormProvider, Resolver, useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
  registerValidationForm,
  registerValidationSchema,
} from "@/schema/registerValidationSchema";
import { onFormError } from "@/utils/method";
import { CustomTextInput } from "@/components/inputfields/textinput";
import { CustomTextAreaInput } from "@/components/inputfields/textareainput";
import { completeProfileAction } from "@/actions/user/profile";

const { Title, Text } = Typography;

export default function RegisterForm() {
  const router = useRouter();
  const { t } = useLanguage();

  const methods = useForm<registerValidationForm>({
    defaultValues: {
      name: "",
      address: "",
      aadhaar: "",
      voterId: "",
    },
    resolver: valibotResolver(
      registerValidationSchema,
    ) as Resolver<registerValidationForm>,
  });

  const { handleSubmit } = methods;
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function onSubmit(values: registerValidationForm) {
    setLoading(true);
    setAlert(null);

    const result = await completeProfileAction({
      name: values.name,
      address: values.address,
      aadhaar: values.aadhaar,
      voterId: values.voterId,
    });

    setLoading(false);

    if (!result.ok) {
      setAlert({
        type: "error",
        text: result.error ?? t("register.error.completeProfile"),
      });
      return;
    }

    router.push("/user");
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #12294a 0%, #1a3c6e 100%)",
          borderRadius: "6px 6px 0 0",
          padding: "24px 28px",
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0, letterSpacing: "0.02em" }}>
          {t("register.title")}
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, display: "block", marginTop: 4 }}>
          {t("register.subtitle")}
        </Text>
      </div>

      <Card
        style={{
          borderRadius: "0 0 6px 6px",
          borderTop: 0,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}
      >
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

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit, onFormError)}>
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
              <CustomTextAreaInput<registerValidationForm>
                name="address"
                title={t("register.addressLabel")}
                placeholder={t("register.addressPlaceholder")}
                required
                maxlength={500}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11.5 w-full rounded bg-[#1a3c6e] text-[15px] font-bold text-white transition hover:bg-[#16335d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("register.submitButton")}
            </button>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}

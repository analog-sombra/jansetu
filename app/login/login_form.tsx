"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Typography, Steps, Alert } from "antd";
import { useLanguage } from "@/components/provider/language_provider";
import { FormProvider, Resolver, useForm } from "react-hook-form";
import {
  loginValidationForm,
  loginValidationSchema,
} from "@/schema/loginValidationSchema";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { onFormError } from "@/utils/method";
import { CustomTextInput } from "@/components/inputfields/textinput";
import { sendOtpAction, verifyOtpAction } from "@/actions/auth";

const { Title, Text } = Typography;

export default function LoginForm() {
  const router = useRouter();
  const { t } = useLanguage();

  const [otpSent, setOtpSent] = useState(false);
  const [sentOtp, setSentOtp] = useState("");
  const [alert, setAlert] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const methods = useForm<loginValidationForm>({
    defaultValues: { mobile: "", otp: "" },
    resolver: valibotResolver(
      loginValidationSchema,
    ) as Resolver<loginValidationForm>,
  });

  const { handleSubmit, setValue, getValues } = methods;

  const onSubmit = async (data: loginValidationForm) => {
    if (!otpSent) {
      await sendOtp(data.mobile);
    } else {
      if (!/^\d{6}$/.test(data.otp)) {
        setAlert({ type: "error", text: t("login.validation.otpInvalid") });
        return;
      }
      await verifyOtp(data);
    }
  };

  async function sendOtp(mobile: string) {
    setLoading(true);
    setAlert(null);
    const result = await sendOtpAction(mobile);
    setLoading(false);
    if (!result.ok) {
      setAlert({
        type: "error",
        text: result.error ?? t("login.error.sendOtp"),
      });
      return;
    }
    setOtpSent(true);
    setSentOtp(result.otp ?? "");
    setAlert({ type: "success", text: t("login.success.otpSent") });
  }

  async function verifyOtp(data: { mobile: string; otp: string }) {
    setLoading(true);
    setAlert(null);
    const result = await verifyOtpAction(data.mobile, data.otp);
    setLoading(false);
    if (!result.ok) {
      setAlert({
        type: "error",
        text: result.error ?? t("login.error.verifyOtp"),
      });
      return;
    }

    if (result.role === "CAMP_DEO" || result.role === "CAMP_FIELD_OFFICER") {
      router.push("/camp");
      return;
    }

    if (
      result.role === "ADMIN" ||
      result.role === "MLA_SECRETARY" ||
      result.role === "SYSTEM"
    ) {
      router.push("/admin");
      return;
    }
    if (result.role === "MLA") {
      router.push("/mla");
      return;
    }

    if (result.role === "MLA_PA" || result.role === "CAMP_HEAD") {
      router.push("/mla-pa");
      return;
    }

    if (!result.firstLoginComplete) {
      router.push("/user/register");
      return;
    }
    router.push("/user");
  }

  return (
    <div className="flex min-h-[76vh] items-center justify-center p-4">
      <div className="w-full max-w-115">
        <div className="rounded-t-md bg-linear-to-br from-[#12294a] to-[#1a3c6e] px-7 pt-7 pb-6 text-center">
          <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/25 bg-white/10 text-[26px]">
            ⚖️
          </div>
          <Title level={3} className="m-0! text-white! tracking-[0.03em]">
            {t("login.title")}
          </Title>
          <Text className="mt-1 block text-xs text-white/65!">
            {t("login.subtitle")}
          </Text>
        </div>

        <Card className=" rounded-b-md border-t-0! shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <Steps
            current={otpSent ? 1 : 0}
            size="small"
            className="mb-6 "
            items={[
              {
                title: t("login.step.mobile"),
                styles: {
                  title: {
                    fontSize: "13px",
                  },
                },
              },
              {
                title: t("login.step.otp"),
                styles: {
                  title: {
                    fontSize: "13px",
                  },
                },
              },
              {
                title: t("login.step.access"),
                styles: {
                  title: {
                    fontSize: "13px",
                  },
                },
              },
            ]}
          />
          <div className="h-4"></div>

          {alert && (
            <Alert
              type={alert.type}
              title={alert.text}
              showIcon
              closable
              className="mb-4"
              onClose={() => setAlert(null)}
            />
          )}

          {sentOtp && (
            <Alert
              type="info"
              title={
                <span>
                  {t("login.devOtp")}:{" "}
                  <strong className="font-mono text-[20px] tracking-[0.375rem] text-[#1a3c6e]">
                    {sentOtp}
                  </strong>
                </span>
              }
              className="mb-4"
            />
          )}

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit, onFormError)}>
              <div className="mb-3">
                <CustomTextInput<loginValidationForm>
                  name="mobile"
                  title={t("login.mobileLabel")}
                  placeholder={t("login.mobilePlaceholder")}
                  required
                  onlynumber
                  maxlength={10}
                  disable={otpSent}
                  extratax="+91"
                />
              </div>

              {otpSent && (
                <div className="mb-3">
                  <CustomTextInput<loginValidationForm>
                    name="otp"
                    title={t("login.otpLabel")}
                    placeholder={t("login.otpPlaceholder")}
                    required
                    onlynumber
                    maxlength={6}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded bg-[#1a3c6e] px-3 py-3 text-white transition hover:bg-[#16335d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {otpSent ? t("login.verifyButton") : t("login.sendButton")}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setAlert(null);
                    setSentOtp("");
                    setValue("otp", "");
                    setValue("mobile", getValues("mobile"));
                  }}
                  className="mt-2 cursor-pointer border-none bg-transparent text-[#1a3c6e]"
                >
                  {t("login.changeMobile")}
                </button>
              )}
            </form>
          </FormProvider>
        </Card>
      </div>
    </div>
  );
}

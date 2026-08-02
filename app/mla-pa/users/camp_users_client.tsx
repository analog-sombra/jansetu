"use client";

import { useState } from "react";
import { Alert, Button, Card, Drawer, Input, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { Resolver, FormProvider, useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useLanguage } from "@/components/provider/language_provider";
import {
  CampUserSummary,
  updateCampCitizenProfileAction,
} from "@/actions/camp";
import {
  registerValidationForm,
  registerValidationSchema,
} from "@/schema/registerValidationSchema";
import { CustomTextAreaInput } from "@/components/inputfields/textareainput";
import { CustomTextInput } from "@/components/inputfields/textinput";
import { onFormError } from "@/utils/method";

const { Title, Text } = Typography;

type CampUsersClientProps = {
  initialUsers: CampUserSummary[];
  initialError?: string;
};

export default function CampUsersClient({
  initialUsers,
  initialError,
}: CampUsersClientProps) {
  const { t } = useLanguage();
  const [users, setUsers] = useState<CampUserSummary[]>(initialUsers);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CampUserSummary | null>(null);
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

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

  const { handleSubmit, reset } = methods;

  function openEditDrawer(user: CampUserSummary) {
    if (user.role !== "CITIZEN") {
      return;
    }

    setSelectedUser(user);
    reset({
      name: user.name ?? "",
      address: user.address ?? "",
      aadhaar: user.aadhaar ?? "",
      voterId: user.voterId ?? "",
    });
    setDrawerOpen(true);
  }

  function closeEditDrawer() {
    setDrawerOpen(false);
    setSelectedUser(null);
    reset({
      name: "",
      address: "",
      aadhaar: "",
      voterId: "",
    });
  }

  async function onSubmit(values: registerValidationForm) {
    if (!selectedUser) {
      return;
    }

    setLoading(true);
    setAlert(null);

    const result = await updateCampCitizenProfileAction({
      userId: selectedUser.id,
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

    setUsers((previous) =>
      previous.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              name: values.name,
              address: values.address,
              aadhaar: values.aadhaar ?? null,
              voterId: values.voterId || null,
            }
          : user,
      ),
    );

    setAlert({
      type: "success",
      text: t("profile.success.update"),
    });

    closeEditDrawer();
  }

  const columns: TableColumnsType<CampUserSummary> = [
    {
      title: t("camp.user.name"),
      dataIndex: "name",
      key: "name",
      width: 170,
      render: (name: string | null) => name || "-",
    },
    {
      title: t("camp.user.mobile"),
      dataIndex: "mobile",
      key: "mobile",
      width: 130,
    },
    {
      title: t("register.voterIdLabel"),
      dataIndex: "voterId",
      key: "voterId",
      width: 150,
      render: (voterId: string | null) => voterId || "-",
    },
    {
      title: t("register.aadhaarLabel"),
      dataIndex: "aadhaar",
      key: "aadhaar",
      width: 150,
      render: (aadhaar: string | null) => aadhaar || "-",
    },
    {
      title: t("register.addressLabel"),
      dataIndex: "address",
      key: "address",
      width: 240,
      render: (address: string | null) => address || "-",
    },
    {
      title: t("camp.user.complaints"),
      dataIndex: "complaintCount",
      key: "complaintCount",
      width: 120,
      sorter: (left, right) => left.complaintCount - right.complaintCount,
    },
    {
      title: t("camp.user.lastComplaint"),
      dataIndex: "lastComplaintAt",
      key: "lastComplaintAt",
      width: 140,
      render: (date: string | null) =>
        date ? new Date(date).toLocaleDateString("en-IN") : "-",
      sorter: (left, right) =>
        new Date(left.lastComplaintAt ?? 0).getTime() -
        new Date(right.lastComplaintAt ?? 0).getTime(),
    },
    {
      title: t("dashboard.table.action"),
      key: "action",
      width: 130,
      render: (_value, record) =>
        record.role === "CITIZEN" ? (
          <Button size="small" onClick={() => openEditDrawer(record)}>
            {t("profile.editButton")}
          </Button>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: "#1a3c6e" }}>
          {t("camp.users.title")}
        </Title>
        <Text type="secondary">{t("camp.users.subtitle")}</Text>
      </div>

      {initialError && (
        <Alert type="error" title={initialError} showIcon style={{ marginBottom: 16 }} />
      )}

      {alert && (
        <Alert
          type={alert.type}
          title={alert.text}
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setAlert(null)}
        />
      )}

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          scroll={{ x: 1320 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${t("dashboard.records")}`,
          }}
        />
      </Card>

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
                <Input value={selectedUser?.mobile ?? ""} disabled className="w-full" />
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
    </div>
  );
}

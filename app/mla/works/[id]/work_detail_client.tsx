"use client";

import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Descriptions,
  Tabs,
  Table,
  Timeline,
  Progress,
  Alert,
  Space,
  Modal,
  Form,
  Select,
  Input,
  message,
  Spin,
  Divider,
  Empty,
  Upload,
  InputNumber,
  DatePicker,
  Image as AntImage,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import {
  WorkDTO,
  WorkTaskDTO,
  WorkMediaDTO,
  WorkUpdateDTO,
  updateWorkAction,
  utilizeWorkBudgetAction,
  closeWorkAction,
  uploadMediaAction,
  addTaskAction,
  addWorkUpdateAction,
  getWorkDetailsAction,
} from "@/actions/mla/works";
import {
  getWorkMappedComplaintsAction,
  type WorkMappedComplaint,
} from "@/actions/admin";
import { WORKSTATUS } from "@prisma/client";
import dayjs from "dayjs";

interface WorkDetailClientProps {
  work: WorkDTO & {
    tasks: WorkTaskDTO[];
    media: Record<string, WorkMediaDTO[]>;
    activity_feed: WorkUpdateDTO[];
  };
  officers: Array<{
    id: number;
    name: string;
    designation: string;
    department: { id: number; name: string };
  }>;
}

const statusColors: Record<WORKSTATUS, string> = {
  PROPOSED: "default",
  APPROVED: "processing",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
  ON_HOLD: "warning",
  CANCELLED: "error",
};

const statusLabels: Record<WORKSTATUS, string> = {
  PROPOSED: "Proposed",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export default function WorkDetailClient({
  work: initialWork,
  officers,
}: WorkDetailClientProps) {
  const router = useRouter();
  const [work, setWork] = useState(initialWork);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Separate form instances for each modal
  const [addTaskForm] = Form.useForm();
  const [updateProgressForm] = Form.useForm();
  const [approveBudgetForm] = Form.useForm();
  const [utilizeBudgetForm] = Form.useForm();
  const [addActivityForm] = Form.useForm();
  const [uploadMediaForm] = Form.useForm();

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Modal states
  const [showAddTask, setShowAddTask] = useState(false);
  const [showUploadMedia, setShowUploadMedia] = useState(false);
  const [showUpdateProgress, setShowUpdateProgress] = useState(false);
  const [showApproveBudget, setShowApproveBudget] = useState(false);
  const [showUtilizeBudget, setShowUtilizeBudget] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<WorkMediaDTO | null>(null);

  // Mapped complaints state
  const [mappedComplaints, setMappedComplaints] = useState<
    WorkMappedComplaint[]
  >([]);
  const [loadingMappedComplaints, setLoadingMappedComplaints] = useState(false);

  const handleCloseWork = () => {
    Modal.confirm({
      title: "Close Work",
      content:
        "Are you sure you want to close this work? This action cannot be undone.",
      okText: "Close",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        setLoading(true);
        setError("");

        try {
          const result = await closeWorkAction({
            id: work.id,
            actual_completion_date: new Date().toISOString().split("T")[0],
          });

          if (result.ok) {
            setWork((prev) => ({
              ...prev,
              ...result.data,
            }));
            message.success("Work closed successfully!");
          } else {
            setError(result.error);
          }
        } catch {
          setError("Failed to close work");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleAddTask = async (values: {
    title: string;
    description: string;
    officer_id: number;
    planned_date: ReturnType<typeof dayjs>;
    remarks: string;
  }) => {
    setLoading(true);
    try {
      const result = await addTaskAction({
        work_id: work.id,
        title: values.title,
        description: values.description || undefined,
        officer_id: values.officer_id,
        planned_date: values.planned_date.toISOString(),
        remarks: values.remarks || undefined,
      });

      if (result.ok) {
        setWork((prev) => ({
          ...prev,
          tasks: [...prev.tasks, result.data],
        }));
        message.success("Task added successfully!");
        setShowAddTask(false);
        addTaskForm.resetFields();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (values: {
    completion_percentage: number;
  }) => {
    setLoading(true);
    try {
      const result = await updateWorkAction({
        id: work.id,
        completion_percentage: values.completion_percentage,
      });

      if (result.ok) {
        setWork((prev) => ({
          ...prev,
          ...result.data,
        }));
        message.success("Progress updated successfully!");
        setShowUpdateProgress(false);
        updateProgressForm.resetFields();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to update progress");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBudget = async (values: { approved_budget: number }) => {
    setLoading(true);
    try {
      const result = await updateWorkAction({
        id: work.id,
        approved_budget: values.approved_budget,
      });

      if (result.ok) {
        setWork((prev) => ({
          ...prev,
          ...result.data,
        }));
        message.success("Budget approved successfully!");
        setShowApproveBudget(false);
        approveBudgetForm.resetFields();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to approve budget");
    } finally {
      setLoading(false);
    }
  };

  const handleUtilizeBudget = async (values: { utilized_budget: number }) => {
    setLoading(true);
    try {
      const result = await utilizeWorkBudgetAction({
        id: work.id,
        utilized_budget: values.utilized_budget,
      });

      if (result.ok) {
        setWork((prev) => ({
          ...prev,
          ...result.data,
        }));
        message.success("Budget utilized successfully!");
        setShowUtilizeBudget(false);
        utilizeBudgetForm.resetFields();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to utilize budget");
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (values: { message: string }) => {
    setLoading(true);
    try {
      const result = await addWorkUpdateAction({
        work_id: work.id,
        message: values.message,
      });

      if (result.ok) {
        setWork((prev) => ({
          ...prev,
          activity_feed: [result.data, ...prev.activity_feed],
        }));
        message.success("Activity added successfully!");
        setShowAddActivity(false);
        addActivityForm.resetFields();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to add activity");
    } finally {
      setLoading(false);
    }
  };

  const refreshWorkData = async () => {
    try {
      const result = await getWorkDetailsAction(work.id);
      if (result.ok) {
        setWork(result.data);
      }
    } catch (err) {
      console.error("Failed to refresh work data:", err);
    }
  };

  const loadMappedComplaints = async () => {
    setLoadingMappedComplaints(true);
    try {
      const result = await getWorkMappedComplaintsAction(work.id);
      if (result.ok) {
        setMappedComplaints(result.complaints);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Failed to load mapped complaints:", err);
      setError("Failed to load mapped complaints");
    } finally {
      setLoadingMappedComplaints(false);
    }
  };

  const handleUploadMedia = async (values: {
    type: string;
    caption?: string;
  }) => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must not exceed 10MB");
      return;
    }

    setLoading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();

      const fileDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 data (remove data:...;base64, prefix)
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(selectedFile);
      const fileData = await fileDataPromise;

      // Call server action with base64 file data
      const result = await uploadMediaAction({
        workId: work.id,
        type: values.type,
        caption: values.caption || undefined,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileData: fileData,
      });

      if (result.ok) {
        message.success("Media uploaded successfully!");
        setShowUploadMedia(false);
        uploadMediaForm.resetFields();
        setSelectedFile(null);
        // Refresh work data to show new media
        await refreshWorkData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to upload media");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const taskColumns = [
    {
      title: "Sequence",
      dataIndex: "sequence_no",
      key: "sequence_no",
      width: "10%",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "30%",
    },
    {
      title: "Officer",
      dataIndex: ["officer", "name"],
      key: "officer",
      width: "20%",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status: string) => (
        <Tag color={status === "COMPLETED" ? "success" : "processing"}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Progress",
      dataIndex: "completion_percentage",
      key: "progress",
      width: "15%",
      render: (percentage: number) => `${percentage}%`,
    },
    {
      title: "Actions",
      key: "actions",
      width: "10%",
      render: () => (
        <Button type="link" size="small">
          View
        </Button>
      ),
    },
  ];

  const mappedComplaintsColumns = [
    {
      title: "Complaint ID",
      dataIndex: ["complaint", "id"],
      key: "complaintId",
      width: "12%",
      render: (id: number) => `#${id}`,
    },
    {
      title: "Category",
      dataIndex: ["complaint", "category"],
      key: "category",
      width: "15%",
    },
    {
      title: "Subcategory",
      dataIndex: ["complaint", "subcategory"],
      key: "subcategory",
      width: "15%",
      render: (text: string | null) => text || "-",
    },
    {
      title: "Sublocality",
      dataIndex: ["complaint", "sublocality"],
      key: "sublocality",
      width: "12%",
      render: (text: string | null) => text || "-",
    },
    {
      title: "Status",
      dataIndex: ["complaint", "status"],
      key: "status",
      width: "12%",
      render: (status: string) => (
        <Tag color={status === "WORKS" ? "green" : "blue"}>{status}</Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: ["complaint", "priority"],
      key: "priority",
      width: "10%",
      render: (priority: number) => (
        <Tag
          color={priority >= 75 ? "red" : priority >= 50 ? "orange" : "green"}
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: "Citizen",
      key: "citizen",
      width: "20%",
      render: (record: WorkMappedComplaint) => (
        <div>
          <div className="font-medium">
            {record.complaint.user.name || "N/A"}
          </div>
          <div className="text-xs text-gray-500">
            {record.complaint.user.mobile}
          </div>
        </div>
      ),
    },
    {
      title: "Mapped Date",
      dataIndex: "mappedAt",
      key: "mappedAt",
      width: "16%",
      render: (date: Date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <div className="p-3">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className="mb-2"
      >
        Back
      </Button>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          className="mb-2"
        />
      )}

      <Spin spinning={loading}>
        <Card className="mb-2">
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{work.title}</h1>
                  <Tag color={statusColors[work.status as WORKSTATUS]}>
                    {statusLabels[work.status as WORKSTATUS]}
                  </Tag>
                </div>
                <Space wrap>
                  {/* <Button
                    type="primary"
                    onClick={() => setShowAddTask(true)}
                    icon={<PlusOutlined />}
                  >
                    Add Task
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setShowUploadMedia(true)}
                    icon={<UploadOutlined />}
                  >
                    Upload Media
                  </Button>
                  <Button
                    onClick={() => setShowUpdateProgress(true)}
                    icon={<EditOutlined />}
                  >
                    Update Progress
                  </Button>
                  <Button
                    onClick={() => setShowApproveBudget(true)}
                    icon={<EditOutlined />}
                  >
                    Approve Budget
                  </Button> */}
                  {work.status !== WORKSTATUS.COMPLETED &&
                    work.status !== WORKSTATUS.CANCELLED && (
                      <Button
                        danger
                        onClick={handleCloseWork}
                        icon={<CheckCircleOutlined />}
                      >
                        Close Work
                      </Button>
                    )}
                </Space>
              </div>
            </Col>
          </Row>

          <Divider className="my-2" />

          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Card type="inner" size="small">
                <Descriptions title="Work Details" column={1} size="small">
                  <Descriptions.Item label="Department">
                    {work.department.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ward">
                    {work.ward?.name || "Not assigned"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Priority">
                    <Tag
                      color={
                        work.priority >= 75
                          ? "red"
                          : work.priority >= 50
                            ? "orange"
                            : "green"
                      }
                    >
                      {work.priority}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {work.created_by?.name || "Unknown"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card type="inner" size="small">
                <Descriptions title="Dates" column={1} size="small">
                  <Descriptions.Item label="Start Date">
                    {work.start_date
                      ? dayjs(work.start_date).format("DD/MM/YYYY")
                      : "Not set"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Target Completion">
                    {work.target_completion_date
                      ? dayjs(work.target_completion_date).format("DD/MM/YYYY")
                      : "Not set"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Actual Completion">
                    {work.actual_completion_date
                      ? dayjs(work.actual_completion_date).format("DD/MM/YYYY")
                      : "Pending"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card type="inner" size="small">
                <Descriptions title="Budget" column={1} size="small">
                  <Descriptions.Item label="Estimated">
                    ₹ {work.estimated_budget || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Approved">
                    ₹ {work.approved_budget || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Utilized">
                    ₹ {work.utilized_budget || 0}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>

          <Card className="mt-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold mb-2">Progress</h3>
              <div className="grow"></div>
              <div>
                <Button
                  onClick={() => setShowUpdateProgress(true)}
                  icon={<EditOutlined />}
                >
                  Update Progress
                </Button>
                <Button
                  onClick={() => setShowApproveBudget(true)}
                  icon={<EditOutlined />}
                >
                  Approve Budget
                </Button>
                <Button
                  onClick={() => setShowUtilizeBudget(true)}
                  icon={<EditOutlined />}
                >
                  Utilize Budget
                </Button>
              </div>
            </div>
            <Progress
              percent={work.completion_percentage}
              status={
                work.completion_percentage === 100
                  ? "success"
                  : work.status === WORKSTATUS.ON_HOLD
                    ? "exception"
                    : "active"
              }
            />
            <p className="text-gray-600 mt-2">
              {work.completion_percentage}% Complete
            </p>
          </Card>

          <Card className="mt-2">
            <h3 className="text-base font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{work.description}</p>
          </Card>

          <Tabs
            defaultActiveKey="1"
            className="mt-2"
            items={[
              {
                key: "1",
                label: `Tasks (${work.tasks.length})`,
                children: (
                  <div>
                    <div className="mb-2">
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => setShowAddTask(true)}
                        icon={<PlusOutlined />}
                      >
                        Add Task
                      </Button>
                    </div>
                    <Table
                      columns={taskColumns}
                      dataSource={work.tasks}
                      rowKey="id"
                      pagination={false}
                      locale={{ emptyText: <Empty description="No tasks" /> }}
                    />
                  </div>
                ),
              },
              {
                key: "2",
                label: `Media & Evidence (${Object.values(work.media).flat().length})`,
                children: (
                  <div>
                    <div className="mb-2">
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => setShowUploadMedia(true)}
                        icon={<UploadOutlined />}
                      >
                        Upload Media
                      </Button>
                    </div>
                    {Object.entries(work.media).length === 0 ? (
                      <Empty description="No media uploaded" />
                    ) : (
                      Object.entries(work.media).map(([type, items]) => (
                        <Card
                          key={type}
                          type="inner"
                          className="mb-2"
                          title={type.toLocaleUpperCase()}
                          size="small"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow"
                              >
                                <div className="mb-1 bg-gray-100 rounded h-20 flex items-center justify-center overflow-hidden">
                                  {item.file_path?.match(
                                    /\.(jpg|jpeg|png|gif|webp)$/i,
                                  ) ? (
                                    <AntImage
                                      src={item.file_path}
                                      alt={item.caption || "Media"}
                                      preview={{
                                        mask: (
                                          <Space>
                                            <EyeOutlined />
                                            View
                                          </Space>
                                        ),
                                      }}
                                      style={{
                                        maxHeight: "128px",
                                        maxWidth: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  ) : (
                                    <div className="text-center text-gray-500 text-sm">
                                      <UploadOutlined className="text-2xl mb-2" />
                                      <p>Document</p>
                                    </div>
                                  )}
                                </div>
                                <p className="font-medium text-xs truncate">
                                  {item.caption || "Untitled"}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                  {item.uploaded_by}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {dayjs(item.created_at).format(
                                    "DD/MM/YYYY HH:mm",
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                ),
              },
              {
                key: "3",
                label: `Activity Feed (${work.activity_feed.length})`,
                children: (
                  <div>
                    <div className="mb-2">
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => setShowAddActivity(true)}
                        icon={<PlusOutlined />}
                      >
                        Add Activity Note
                      </Button>
                    </div>
                    <Timeline
                      items={work.activity_feed.map((update) => ({
                        children: (
                          <div>
                            <p className="font-medium">{update.message}</p>
                            <p className="text-sm text-gray-600">
                              {update.created_by} -{" "}
                              {dayjs(update.created_at).format(
                                "DD/MM/YYYY HH:mm",
                              )}
                            </p>
                          </div>
                        ),
                      }))}
                    />
                  </div>
                ),
              },
              {
                key: "4",
                label: `Mapped Complaints (${mappedComplaints.length})`,
                children: (
                  <div>
                    <div className="mb-2">
                      <Button
                        type="primary"
                        size="small"
                        onClick={loadMappedComplaints}
                        loading={loadingMappedComplaints}
                      >
                        {loadingMappedComplaints
                          ? "Loading..."
                          : "Load Complaints"}
                      </Button>
                    </div>
                    {mappedComplaints.length === 0 &&
                    !loadingMappedComplaints ? (
                      <Empty description="No complaints mapped to this work" />
                    ) : (
                      <Spin spinning={loadingMappedComplaints}>
                        <Table
                          columns={mappedComplaintsColumns}
                          dataSource={mappedComplaints.map((item) => ({
                            ...item,
                            key: item.id,
                          }))}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                          locale={{
                            emptyText: (
                              <Empty description="No complaints mapped" />
                            ),
                          }}
                        />
                      </Spin>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* Add Task Modal */}
        <Modal
          title="Add Task"
          open={showAddTask}
          onOk={() => addTaskForm.submit()}
          onCancel={() => {
            setShowAddTask(false);
            addTaskForm.resetFields();
          }}
          confirmLoading={loading}
        >
          <Form form={addTaskForm} layout="vertical" onFinish={handleAddTask}>
            <Form.Item
              name="title"
              label="Task Title"
              rules={[{ required: true, message: "Please enter task title" }]}
            >
              <Input placeholder="Enter task title" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Enter task description" />
            </Form.Item>

            <Form.Item
              name="officer_id"
              label="Assign to Officer"
              rules={[{ required: true, message: "Please select an officer" }]}
            >
              <Select
                placeholder="Select officer"
                options={officers
                  .filter(
                    (officer) => officer.department.id === work.department.id,
                  )
                  .map((officer) => ({
                    label: `${officer.name} - ${officer.designation}`,
                    value: officer.id,
                  }))}
              />
            </Form.Item>

            <Form.Item
              name="planned_date"
              label="Planned Date"
              rules={[
                { required: true, message: "Please select planned date" },
              ]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="remarks" label="Remarks">
              <Input.TextArea rows={2} placeholder="Enter any remarks" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Upload Media Modal */}
        <Modal
          title="Upload Media"
          open={showUploadMedia}
          onOk={() => uploadMediaForm.submit()}
          onCancel={() => {
            setShowUploadMedia(false);
            uploadMediaForm.resetFields();
            setSelectedFile(null);
          }}
          confirmLoading={loading}
        >
          <Form
            form={uploadMediaForm}
            layout="vertical"
            onFinish={handleUploadMedia}
          >
            <Form.Item
              name="type"
              label="Media Type"
              rules={[{ required: true, message: "Please select media type" }]}
            >
              <Select
                placeholder="Select media type"
                options={[
                  { label: "Before", value: "BEFORE" },
                  { label: "Progress", value: "PROGRESS" },
                  { label: "After", value: "AFTER" },
                  { label: "Document", value: "DOCUMENT" },
                ]}
              />
            </Form.Item>

            <Form.Item name="caption" label="Caption">
              <Input placeholder="Enter media caption (optional)" />
            </Form.Item>

            <Form.Item
              label="File"
              rules={[{ required: true, message: "Please upload a file" }]}
            >
              <Upload
                maxCount={1}
                beforeUpload={(file) => {
                  setSelectedFile(file);
                  return false; // Prevent automatic upload
                }}
                onRemove={() => setSelectedFile(null)}
              >
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>

        {/* Update Progress Modal */}
        <Modal
          title="Update Progress"
          open={showUpdateProgress}
          onOk={() => updateProgressForm.submit()}
          onCancel={() => {
            setShowUpdateProgress(false);
            updateProgressForm.resetFields();
          }}
          confirmLoading={loading}
        >
          <Form
            form={updateProgressForm}
            layout="vertical"
            onFinish={handleUpdateProgress}
          >
            <Form.Item
              name="completion_percentage"
              label="Completion Percentage (%)"
              rules={[
                {
                  required: true,
                  message: "Please enter completion percentage",
                },
              ]}
            >
              <InputNumber
                min={0}
                max={100}
                className="w-full"
                placeholder="0-100"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Approve Budget Modal */}
        <Modal
          title="Approve Budget"
          open={showApproveBudget}
          onOk={() => approveBudgetForm.submit()}
          onCancel={() => {
            setShowApproveBudget(false);
            approveBudgetForm.resetFields();
          }}
          confirmLoading={loading}
        >
          <Form
            form={approveBudgetForm}
            layout="vertical"
            onFinish={handleApproveBudget}
          >
            <Form.Item label="Estimated Budget">
              <span>₹ {work.estimated_budget || 0}</span>
            </Form.Item>

            <Form.Item
              name="approved_budget"
              label="Approved Budget (₹)"
              rules={[
                { required: true, message: "Please enter approved budget" },
              ]}
            >
              <InputNumber
                min={0}
                className="w-full"
                placeholder="Enter approved budget"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Utilize Budget Modal */}
        <Modal
          title="Utilize Budget"
          open={showUtilizeBudget}
          onOk={() => utilizeBudgetForm.submit()}
          onCancel={() => {
            setShowUtilizeBudget(false);
            utilizeBudgetForm.resetFields();
          }}
          confirmLoading={loading}
        >
          <Form
            form={utilizeBudgetForm}
            layout="vertical"
            onFinish={handleUtilizeBudget}
          >
            <Form.Item label="Approved Budget">
              <span>₹ {work.approved_budget || 0}</span>
            </Form.Item>

            <Form.Item label="Current Utilized">
              <span>₹ {work.utilized_budget || 0}</span>
            </Form.Item>

            <Form.Item
              name="utilized_budget"
              label="Utilize Budget (₹)"
              rules={[
                { required: true, message: "Please enter utilized budget" },
              ]}
            >
              <InputNumber
                min={0}
                max={work.approved_budget || undefined}
                className="w-full"
                placeholder="Enter utilized budget"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Add Activity Modal */}
        <Modal
          title="Add Activity Note"
          open={showAddActivity}
          onOk={() => addActivityForm.submit()}
          onCancel={() => {
            setShowAddActivity(false);
            addActivityForm.resetFields();
          }}
          confirmLoading={loading}
        >
          <Form
            form={addActivityForm}
            layout="vertical"
            onFinish={handleAddActivity}
          >
            <Form.Item
              name="message"
              label="Activity Note"
              rules={[
                { required: true, message: "Please enter activity note" },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Enter activity note or update"
                maxLength={1000}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Image Viewer Modal */}
        <Modal
          title={selectedImage?.caption || "View Image"}
          open={showImageViewer}
          onCancel={() => {
            setShowImageViewer(false);
            setSelectedImage(null);
          }}
          footer={null}
          width={600}
        >
          {selectedImage &&
          selectedImage.file_path?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <div className="flex flex-col items-center">
              <img
                src={selectedImage.file_path}
                alt={selectedImage.caption || "Media"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                }}
              />
              <div className="mt-2 w-full text-gray-600 text-xs">
                <p>
                  <strong>Type:</strong> {selectedImage.type}
                </p>
                <p>
                  <strong>Uploaded by:</strong> {selectedImage.uploaded_by}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {dayjs(selectedImage.created_at).format("DD/MM/YYYY HH:mm")}
                </p>
                {selectedImage.caption && (
                  <p>
                    <strong>Caption:</strong> {selectedImage.caption}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Empty description="Cannot preview this file" />
          )}
        </Modal>
      </Spin>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Typography,
  Descriptions,
  Steps,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { productionApi, productApi } from "../utils/api";
import dayjs from "dayjs";

const { Title } = Typography;

function ProductionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        productionApi.getOrders({ status: statusFilter, keyword }),
        productApi.getList(),
      ]);
      if (ordersRes.success) setOrders(ordersRes.data || []);
      if (productsRes.success) setProducts(productsRes.data || []);
    } catch (err) {
      message.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleReset = () => {
    setKeyword("");
    setStatusFilter(undefined);
    setSearchParams({});
    // 直接用空值查询
    productionApi.getOrders({ status: undefined, keyword: "" }).then((res) => {
      if (res.success) setOrders(res.data || []);
    });
  };

  const handleAdd = () => {
    setModalType("add");
    setCurrentOrder(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setModalType("edit");
    setCurrentOrder(record);
    form.setFieldsValue({
      ...record,
      planned_start_date: record.planned_start_date
        ? dayjs(record.planned_start_date)
        : null,
      planned_end_date: record.planned_end_date
        ? dayjs(record.planned_end_date)
        : null,
    });
    setModalVisible(true);
  };

  const handleView = async (record) => {
    setCurrentOrder(record);
    try {
      const res = await productionApi.getProcesses(record.id);
      if (res.success) {
        setProcesses(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
    setDetailVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await productionApi.deleteOrder(id);
      if (res.success) {
        message.success("删除成功");
        loadData();
      } else {
        message.error(res.message || "删除失败");
      }
    } catch (err) {
      message.error(err.message || "删除失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        planned_start_date: values.planned_start_date?.format("YYYY-MM-DD"),
        planned_end_date: values.planned_end_date?.format("YYYY-MM-DD"),
      };

      if (modalType === "add") {
        const res = await productionApi.createOrder(data);
        if (res.success) {
          message.success("创建成功");
          setModalVisible(false);
          loadData();
        } else {
          message.error(res.message || "创建失败");
        }
      } else {
        const res = await productionApi.updateOrder(currentOrder.id, data);
        if (res.success) {
          message.success("更新成功");
          setModalVisible(false);
          loadData();
        } else {
          message.error(res.message || "更新失败");
        }
      }
    } catch (err) {
      // 表单验证错误
    }
  };

  const statusConfig = {
    PENDING: { text: "待生产", color: "orange" },
    IN_PROGRESS: { text: "生产中", color: "blue" },
    COMPLETED: { text: "已完成", color: "green" },
    CANCELLED: { text: "已取消", color: "default" },
  };

  const priorityConfig = {
    1: { text: "紧急", color: "red" },
    2: { text: "高", color: "orange" },
    3: { text: "中", color: "blue" },
    4: { text: "低", color: "default" },
  };

  const columns = [
    {
      title: "订单号",
      dataIndex: "order_no",
      key: "order_no",
      width: 150,
      fixed: "left",
    },
    {
      title: "产品名称",
      dataIndex: "product_name",
      key: "product_name",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "数量",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
    },
    {
      title: "客户名称",
      dataIndex: "customer_name",
      key: "customer_name",
      width: 120,
      render: (text) => text || "-",
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      width: 80,
      render: (priority) => {
        const config = priorityConfig[priority] || {
          text: "中",
          color: "blue",
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const config = statusConfig[status] || {
          text: status,
          color: "default",
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "计划开始",
      dataIndex: "planned_start_date",
      key: "planned_start_date",
      width: 110,
      render: (text) => text || "-",
    },
    {
      title: "计划结束",
      dataIndex: "planned_end_date",
      key: "planned_end_date",
      width: 110,
      render: (text) => text || "-",
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => handleView(record)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个订单吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getProcessStatus = () => {
    if (!processes.length) return 0;
    const completed = processes.filter((p) => p.status === "COMPLETED").length;
    const inProgress = processes.findIndex((p) => p.status === "IN_PROGRESS");
    if (inProgress >= 0) return inProgress;
    return completed;
  };

  return (
    <div>
      <Card
        className="page-header-card"
        style={{ borderRadius: 8, marginBottom: 24 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          <AppstoreOutlined style={{ marginRight: 8 }} />
          生产管理
        </div>
        <Space>
          <Select
            placeholder="全部状态"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
            }}
            style={{ width: 120 }}
            allowClear
          >
            <Select.Option value="PENDING">待生产</Select.Option>
            <Select.Option value="IN_PROGRESS">生产中</Select.Option>
            <Select.Option value="COMPLETED">已完成</Select.Option>
            <Select.Option value="CANCELLED">已取消</Select.Option>
          </Select>
          <Input
            placeholder="搜索订单号/产品/客户"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
          />
          <Button onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建订单
          </Button>
        </Space>
      </Card>

      <Card style={{ borderRadius: 8 }}>
        <Table
          loading={loading}
          dataSource={orders}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新建/编辑订单弹窗 */}
      <Modal
        title={modalType === "add" ? "新建生产订单" : "编辑生产订单"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
        getContainer={false}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ priority: 3, quantity: 1 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_id"
                label="产品"
                rules={[{ required: true, message: "请选择产品" }]}
              >
                <Select
                  placeholder="请选择产品"
                  showSearch
                  optionFilterProp="children"
                >
                  {products.map((prod) => (
                    <Select.Option key={prod.id} value={prod.id}>
                      {prod.product_name} ({prod.product_code})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: "请输入数量" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_name" label="客户名称">
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_order_no" label="客户订单号">
                <Input placeholder="请输入客户订单号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="planned_start_date" label="计划开始日期">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="planned_end_date" label="计划结束日期">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select placeholder="请选择优先级">
                  <Select.Option value={1}>紧急</Select.Option>
                  <Select.Option value={2}>高</Select.Option>
                  <Select.Option value={3}>中</Select.Option>
                  <Select.Option value={4}>低</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            {modalType === "edit" && (
              <Col span={12}>
                <Form.Item name="status" label="状态">
                  <Select placeholder="请选择状态">
                    <Select.Option value="PENDING">待生产</Select.Option>
                    <Select.Option value="IN_PROGRESS">生产中</Select.Option>
                    <Select.Option value="COMPLETED">已完成</Select.Option>
                    <Select.Option value="CANCELLED">已取消</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
        getContainer={false}
      >
        {currentOrder && (
          <>
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{
                marginBottom: 24,
                background: "#fafafa",
                borderRadius: 8,
              }}
            >
              <Descriptions.Item label="订单号">
                {currentOrder.order_no}
              </Descriptions.Item>
              <Descriptions.Item label="产品">
                {currentOrder.product_name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="数量">
                {currentOrder.quantity}
              </Descriptions.Item>
              <Descriptions.Item label="客户">
                {currentOrder.customer_name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[currentOrder.status]?.color}>
                  {statusConfig[currentOrder.status]?.text ||
                    currentOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityConfig[currentOrder.priority]?.color}>
                  {priorityConfig[currentOrder.priority]?.text || "中"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="计划开始">
                {currentOrder.planned_start_date || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="计划结束">
                {currentOrder.planned_end_date || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {currentOrder.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {currentOrder.remarks || "-"}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginBottom: 20 }}>
              生产流程
            </Title>
            <div
              style={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
                padding: "24px",
                borderRadius: "12px",
                marginBottom: 16,
              }}
            >
              <Steps
                current={getProcessStatus()}
                size="small"
                items={processes.map((proc, index) => ({
                  title: (
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          proc.status === "COMPLETED"
                            ? "#52c41a"
                            : proc.status === "IN_PROGRESS"
                              ? "#1890ff"
                              : "#666",
                      }}
                    >
                      {proc.process_name}
                    </span>
                  ),
                  description: (
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          color: "#8c8c8c",
                          fontSize: "13px",
                          marginBottom: 6,
                        }}
                      >
                        {proc.department_name}
                      </div>
                      <Tag
                        color={
                          proc.status === "COMPLETED"
                            ? "success"
                            : proc.status === "IN_PROGRESS"
                              ? "processing"
                              : "default"
                        }
                        style={{
                          borderRadius: "12px",
                          padding: "2px 10px",
                          fontSize: "12px",
                        }}
                      >
                        {proc.status === "COMPLETED"
                          ? "✓ 已完成"
                          : proc.status === "IN_PROGRESS"
                            ? "◉ 进行中"
                            : "○ 待处理"}
                      </Tag>
                      {proc.end_time && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#999",
                            marginTop: 4,
                          }}
                        >
                          完成: {proc.end_time}
                        </div>
                      )}
                    </div>
                  ),
                  status:
                    proc.status === "COMPLETED"
                      ? "finish"
                      : proc.status === "IN_PROGRESS"
                        ? "process"
                        : "wait",
                }))}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default ProductionPage;

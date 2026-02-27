import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  FunctionField,
  Show,
  SimpleShowLayout,
} from "react-admin";

const StatusField = ({ source }: { source: string }) => (
  <FunctionField
    source={source}
    render={(record: any) => {
      const status = record[source];
      const colors: Record<string, string> = {
        registered: "#FFA726",
        in_progress: "#42A5F5",
        completed: "#66BB6A",
        reassigned: "#AB47BC",
      };
      const labels: Record<string, string> = {
        registered: "Đã đăng ký",
        in_progress: "Đang làm",
        completed: "Hoàn thành",
        reassigned: "Chuyển công",
      };
      return (
        <span
          style={{
            backgroundColor: colors[status] || "#999",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {labels[status] || status}
        </span>
      );
    }}
  />
);

export const RegistrationList = () => (
  <List>
    <Datagrid rowClick="show">
      <DateField source="date" label="Ngày" />
      <ReferenceField
        source="userId"
        reference="users"
        label="Công nhân"
        link={false}
      >
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField
        source="operationId"
        reference="operations"
        label="Thao tác"
        link={false}
      >
        <TextField source="name" />
      </ReferenceField>
      <NumberField source="expectedQuantity" label="SL quy định" />
      <NumberField source="actualQuantity" label="SL thực tế" />
      <NumberField source="deviation" label="Chênh lệch" />
      <NumberField source="bonusAmount" label="Thưởng (đ)" />
      <NumberField source="penaltyAmount" label="Phạt (đ)" />
      <StatusField source="status" />
    </Datagrid>
  </List>
);

export const RegistrationShow = () => (
  <Show>
    <SimpleShowLayout>
      <DateField source="date" label="Ngày" />
      <ReferenceField source="userId" reference="users" label="Công nhân">
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField
        source="operationId"
        reference="operations"
        label="Thao tác"
      >
        <TextField source="name" />
      </ReferenceField>
      <NumberField source="expectedQuantity" label="Sản lượng quy định" />
      <NumberField source="adjustedExpectedQty" label="SL điều chỉnh" />
      <NumberField source="actualQuantity" label="Sản lượng thực tế" />
      <NumberField source="deviation" label="Chênh lệch" />
      <NumberField source="bonusAmount" label="Tiền thưởng" />
      <NumberField source="penaltyAmount" label="Tiền phạt" />
      <TextField source="interruptionNote" label="Ghi chú gián đoạn" />
      <NumberField
        source="interruptionMinutes"
        label="Thời gian gián đoạn (phút)"
      />
      <TextField source="adjustmentNote" label="Ghi chú điều chỉnh" />
      <TextField source="status" label="Trạng thái" />
    </SimpleShowLayout>
  </Show>
);

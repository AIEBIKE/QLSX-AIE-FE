import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  EditButton,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  DateInput,
  ReferenceInput,
  SelectInput,
  required,
  ChipField,
  FunctionField,
} from "react-admin";

const statusChoices = [
  { id: "pending", name: "Chờ xử lý" },
  { id: "in_progress", name: "Đang thực hiện" },
  { id: "completed", name: "Hoàn thành" },
  { id: "cancelled", name: "Đã hủy" },
];

const StatusField = ({ source }: { source: string }) => (
  <FunctionField
    source={source}
    render={(record: any) => {
      const status = record[source];
      const colors: Record<string, string> = {
        pending: "#FFA726",
        in_progress: "#42A5F5",
        completed: "#66BB6A",
        cancelled: "#EF5350",
      };
      const labels: Record<string, string> = {
        pending: "Chờ xử lý",
        in_progress: "Đang thực hiện",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
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

export const ProductionOrderList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="orderCode" label="Mã lệnh" />
      <ReferenceField
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <TextField source="name" />
      </ReferenceField>
      <NumberField source="quantity" label="Số lượng" />
      <DateField source="startDate" label="Ngày bắt đầu" />
      <DateField source="expectedEndDate" label="Dự kiến hoàn thành" />
      <StatusField source="status" />
      <EditButton />
    </Datagrid>
  </List>
);

export const ProductionOrderCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <NumberInput source="quantity" label="Số lượng" validate={required()} />
      <DateInput
        source="startDate"
        label="Ngày bắt đầu"
        validate={required()}
      />
      <DateInput source="expectedEndDate" label="Dự kiến hoàn thành" />
      <TextInput source="note" label="Ghi chú" multiline />
    </SimpleForm>
  </Create>
);

export const ProductionOrderEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="orderCode" label="Mã lệnh" disabled />
      <ReferenceInput
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <NumberInput source="quantity" label="Số lượng" validate={required()} />
      <DateInput
        source="startDate"
        label="Ngày bắt đầu"
        validate={required()}
      />
      <DateInput source="expectedEndDate" label="Dự kiến hoàn thành" />
      <SelectInput source="status" label="Trạng thái" choices={statusChoices} />
      <TextInput source="note" label="Ghi chú" multiline />
    </SimpleForm>
  </Edit>
);

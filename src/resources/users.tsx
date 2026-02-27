import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  EditButton,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  PasswordInput,
  required,
  FunctionField,
} from "react-admin";

const roleChoices = [
  { id: "admin", name: "Quản trị viên" },
  { id: "supervisor", name: "Giám sát" },
  { id: "worker", name: "Công nhân" },
];

const RoleField = ({ source }: { source: string }) => (
  <FunctionField
    source={source}
    render={(record: any) => {
      const role = record[source];
      const labels: Record<string, string> = {
        admin: "Quản trị viên",
        supervisor: "Giám sát",
        worker: "Công nhân",
      };
      const colors: Record<string, string> = {
        admin: "#E53935",
        supervisor: "#FB8C00",
        worker: "#43A047",
      };
      return (
        <span
          style={{
            backgroundColor: colors[role] || "#999",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {labels[role] || role}
        </span>
      );
    }}
  />
);

export const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="code" label="Mã NV" />
      <TextField source="name" label="Họ tên" />
      <TextField source="department" label="Bộ phận" />
      <RoleField source="role" />
      <BooleanField source="active" label="Hoạt động" />
      <EditButton />
    </Datagrid>
  </List>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="code" label="Mã nhân viên" validate={required()} />
      <TextInput source="name" label="Họ tên" validate={required()} />
      <PasswordInput source="password" label="Mật khẩu" validate={required()} />
      <TextInput source="department" label="Bộ phận" />
      <SelectInput
        source="role"
        label="Vai trò"
        choices={roleChoices}
        defaultValue="worker"
      />
    </SimpleForm>
  </Create>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="code" label="Mã nhân viên" disabled />
      <TextInput source="name" label="Họ tên" validate={required()} />
      <PasswordInput
        source="password"
        label="Mật khẩu mới (bỏ trống nếu không đổi)"
      />
      <TextInput source="department" label="Bộ phận" />
      <SelectInput source="role" label="Vai trò" choices={roleChoices} />
      <BooleanInput source="active" label="Hoạt động" />
    </SimpleForm>
  </Edit>
);

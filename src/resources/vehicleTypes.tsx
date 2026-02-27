import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  EditButton,
  DeleteButton,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  BooleanInput,
  required,
} from "react-admin";

export const VehicleTypeList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="code" label="Mã" />
      <TextField source="name" label="Tên loại xe" />
      <TextField source="description" label="Mô tả" />
      <BooleanField source="active" label="Hoạt động" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const VehicleTypeCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="code" label="Mã loại xe" validate={required()} />
      <TextInput source="name" label="Tên loại xe" validate={required()} />
      <TextInput source="description" label="Mô tả" multiline />
    </SimpleForm>
  </Create>
);

export const VehicleTypeEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="code" label="Mã loại xe" validate={required()} />
      <TextInput source="name" label="Tên loại xe" validate={required()} />
      <TextInput source="description" label="Mô tả" multiline />
      <BooleanInput source="active" label="Hoạt động" />
    </SimpleForm>
  </Edit>
);

import {
  List,
  Datagrid,
  TextField,
  NumberField,
  BooleanField,
  ReferenceField,
  EditButton,
  DeleteButton,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  ReferenceInput,
  SelectInput,
  required,
} from "react-admin";

export const ProcessList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="code" label="Mã" />
      <TextField source="name" label="Tên công đoạn" />
      <ReferenceField
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <TextField source="name" />
      </ReferenceField>
      <NumberField source="order" label="Thứ tự" />
      <BooleanField source="active" label="Hoạt động" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const ProcessCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="code" label="Mã công đoạn" validate={required()} />
      <TextInput source="name" label="Tên công đoạn" validate={required()} />
      <ReferenceInput
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <NumberInput source="order" label="Thứ tự" defaultValue={0} />
      <TextInput source="description" label="Mô tả" multiline />
    </SimpleForm>
  </Create>
);

export const ProcessEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="code" label="Mã công đoạn" validate={required()} />
      <TextInput source="name" label="Tên công đoạn" validate={required()} />
      <ReferenceInput
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <NumberInput source="order" label="Thứ tự" />
      <TextInput source="description" label="Mô tả" multiline />
      <BooleanInput source="active" label="Hoạt động" />
    </SimpleForm>
  </Edit>
);

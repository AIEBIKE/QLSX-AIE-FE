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

export const OperationList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="code" label="Mã" />
      <TextField source="name" label="Tên thao tác" />
      <ReferenceField
        source="processId"
        reference="processes"
        label="Công đoạn"
      >
        <TextField source="name" />
      </ReferenceField>
      <NumberField source="difficulty" label="Độ khó" />
      <BooleanField source="allowTeamwork" label="Teamwork" />
      <NumberField source="maxWorkers" label="Max CN" />
      <BooleanField source="active" label="Hoạt động" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const OperationCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="code" label="Mã thao tác" validate={required()} />
      <TextInput source="name" label="Tên thao tác" validate={required()} />
      <ReferenceInput
        source="processId"
        reference="processes"
        label="Công đoạn"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <NumberInput
        source="difficulty"
        label="Độ khó (1-5)"
        defaultValue={1}
        min={1}
        max={5}
      />
      <BooleanInput source="allowTeamwork" label="Cho phép teamwork" />
      <NumberInput
        source="maxWorkers"
        label="Số CN tối đa"
        defaultValue={1}
        min={1}
        max={10}
      />
      <TextInput source="description" label="Mô tả" multiline />
    </SimpleForm>
  </Create>
);

export const OperationEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="code" label="Mã thao tác" validate={required()} />
      <TextInput source="name" label="Tên thao tác" validate={required()} />
      <ReferenceInput
        source="processId"
        reference="processes"
        label="Công đoạn"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <NumberInput source="difficulty" label="Độ khó (1-5)" min={1} max={5} />
      <BooleanInput source="allowTeamwork" label="Cho phép teamwork" />
      <NumberInput source="maxWorkers" label="Số CN tối đa" min={1} max={10} />
      <TextInput source="description" label="Mô tả" multiline />
      <BooleanInput source="active" label="Hoạt động" />
    </SimpleForm>
  </Edit>
);

import {
  List,
  Datagrid,
  TextField,
  NumberField,
  ReferenceField,
  EditButton,
  DeleteButton,
  Create,
  Edit,
  SimpleForm,
  NumberInput,
  ReferenceInput,
  SelectInput,
  TextInput,
  required,
} from "react-admin";

export const ProductionStandardList = () => (
  <List>
    <Datagrid rowClick="edit">
      <ReferenceField
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField
        source="operationId"
        reference="operations"
        label="Thao tác"
      >
        <TextField source="name" />
      </ReferenceField>
      <NumberField source="expectedQuantity" label="SL quy định" />
      <NumberField source="bonusPerUnit" label="Thưởng/SP (đ)" />
      <NumberField source="penaltyPerUnit" label="Phạt/SP (đ)" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const ProductionStandardCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <ReferenceInput
        source="operationId"
        reference="operations"
        label="Thao tác"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <NumberInput
        source="expectedQuantity"
        label="Sản lượng quy định"
        validate={required()}
      />
      <NumberInput
        source="bonusPerUnit"
        label="Tiền thưởng/SP (đ)"
        defaultValue={0}
      />
      <NumberInput
        source="penaltyPerUnit"
        label="Tiền phạt/SP (đ)"
        defaultValue={0}
      />
      <TextInput source="description" label="Mô tả" multiline />
    </SimpleForm>
  </Create>
);

export const ProductionStandardEdit = () => (
  <Edit>
    <SimpleForm>
      <ReferenceInput
        source="vehicleTypeId"
        reference="vehicle-types"
        label="Loại xe"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <ReferenceInput
        source="operationId"
        reference="operations"
        label="Thao tác"
      >
        <SelectInput optionText="name" validate={required()} />
      </ReferenceInput>
      <NumberInput
        source="expectedQuantity"
        label="Sản lượng quy định"
        validate={required()}
      />
      <NumberInput source="bonusPerUnit" label="Tiền thưởng/SP (đ)" />
      <NumberInput source="penaltyPerUnit" label="Tiền phạt/SP (đ)" />
      <TextInput source="description" label="Mô tả" multiline />
    </SimpleForm>
  </Edit>
);

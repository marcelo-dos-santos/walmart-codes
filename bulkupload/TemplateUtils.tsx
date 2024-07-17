import { Options } from '../utils/formInterface';

interface FilterData {
  links: Array<{
    link_name: string;
    data: Array<{
      value: number | string;
      label: string;
    }>;
  }>;
}

interface SelectedValues {
  [key: string]: string | number;
}

export const fieldLabelMapping: { [key: string]: string } = {
  purchaseCompany: '*Purchase Company',
  expenseType: '*Element',
  expenseParameter: '*Factor',
  loadingPort: '*Loading Port',
  entryPort: '*Entry Port',
  destinationPort: '*Destination Port',
  transportMode: '*Transport Mode',
  container: '*Container Type',
  agentOffice: '*Agent Office',
  department: '*Department',
  country: '*Origin Country',
  importCountry: '*Import Country',
  taxCategory: '*Tax Category',
};

export const moreThanOneDynamicSelectIsEmpty = (
  dropdownConfigs: any[],
  selectedValues: SelectedValues
) => {
  const dynamicSelects = dropdownConfigs.map(
    (config) => selectedValues[config.name]
  );
  const emptySelectsCount = dynamicSelects.filter((value) => !value).length;
  return emptySelectsCount > 1;
};

const findLabelByValue = (
  linkName: string,
  value: string,
  filterData: FilterData
) => {
  if (!filterData || !filterData.links) {
    console.error('filterData or filterData.links is undefined');
    return 'Label not found';
  }

  const link = filterData.links.find((link) => link.link_name === linkName);
  if (!link) {
    console.error(`Link not found for ${linkName}`);
    return 'Label not found';
  }

  const dataEntry = link.data.find((d) => d.value.toString() === value);
  return dataEntry ? dataEntry.label : 'Label not found';
};

const findLabelInOptions = (value: string, options: Options[]) => {
  const foundOption = options.find(
    (option) =>
      option.value !== null &&
      option.value !== undefined &&
      option.value.toString() === value
  );
  return foundOption ? foundOption.label : 'Label not found';
};

export const createTemplateData = (
  selectedValues: SelectedValues,
  filterData: FilterData,
  optionsData: {
    purchaseCompanyOptions: Options[];
    expenseTypeOptions: Options[];
    expenseParameterOptions: Options[];
  }
) => {
  const templateData = [];
  const {
    purchaseCompanyOptions,
    expenseTypeOptions,
    expenseParameterOptions,
  } = optionsData;

  const findLabelFuncs = {
    purchaseCompany: (value: string) =>
      findLabelInOptions(value, purchaseCompanyOptions),
    expenseType: (value: string) =>
      findLabelInOptions(value, expenseTypeOptions),
    expenseParameter: (value: string) =>
      findLabelInOptions(value, expenseParameterOptions),
    department: (value: string) =>
      findLabelByValue('department', value, filterData),
    loadingPort: (value: string) => findLabelByValue('port', value, filterData),
    entryPort: (value: string) => findLabelByValue('port', value, filterData),
    transportMode: (value: string) =>
      findLabelByValue('transportMode', value, filterData),
    container: (value: string) =>
      findLabelByValue('container', value, filterData),
    agentOffice: (value: string) =>
      findLabelByValue('agentOffice', value, filterData),
    country: (value: string) => findLabelByValue('country', value, filterData),
    taxCategory: (value: string) =>
      findLabelByValue('taxCategory', value, filterData),
    importCountry: (value: string) =>
      findLabelByValue('country', value, filterData),
    destinationPort: (value: string) =>
      findLabelByValue('port', value, filterData),
  };

  const addDataWithLabels = (
    data: SelectedValues
  ): { [key: string]: string } => {
    const rowData: { [key: string]: string } = {};

    Object.entries(fieldLabelMapping).forEach(([key, label]) => {
      const value = data[key] ? data[key].toString() : '';
      const findLabelFunction =
        findLabelFuncs[key as keyof typeof findLabelFuncs];
      const labelValue = findLabelFunction ? findLabelFunction(value) : '';
      rowData[label] = labelValue || 'Label not found';
    });

    rowData['Effective Date'] = 'YYYY-MM-DD';
    rowData['Termination Date'] = 'YYYY-MM-DD';
    rowData['Rate Type'] = '';
    rowData['Rate Value'] = '';
    rowData['Currency Code'] = '';
    rowData['Unit of Measure'] = '';
    rowData['Update User ID'] = '';

    return rowData;
  };

  if (
    !selectedValues.department &&
    [80, 81].includes(Number(selectedValues.expenseParameter))
  ) {
    const departments =
      filterData.links.find((link) => link.link_name === 'department')?.data ||
      [];
    departments.forEach((department) => {
      const data = { ...selectedValues, department: department.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.loadingPort &&
    [51, 53].includes(Number(selectedValues.expenseParameter))
  ) {
    const loadingPort =
      filterData.links.find((link) => link.link_name === 'port')?.data || [];
    loadingPort.forEach((loadingPort) => {
      const data = { ...selectedValues, loadingPort: loadingPort.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.entryPort &&
    [51, 53, 60, 61].includes(Number(selectedValues.expenseParameter))
  ) {
    const entryPort =
      filterData.links.find((link) => link.link_name === 'port')?.data || [];
    entryPort.forEach((entryPort) => {
      const data = { ...selectedValues, entryPort: entryPort.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.transportMode &&
    [51, 53].includes(Number(selectedValues.expenseParameter))
  ) {
    const transportMode =
      filterData.links.find((link) => link.link_name === 'transportMode')
        ?.data || [];
    transportMode.forEach((transportMode) => {
      const data = { ...selectedValues, transportMode: transportMode.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.container &&
    [51, 53, 61].includes(Number(selectedValues.expenseParameter))
  ) {
    const container =
      filterData.links.find((link) => link.link_name === 'container')?.data ||
      [];
    container.forEach((container) => {
      const data = { ...selectedValues, container: container.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.agentOffice &&
    [31, 30].includes(Number(selectedValues.expenseParameter))
  ) {
    const agentOffice =
      filterData.links.find((link) => link.link_name === 'agentOffice')?.data ||
      [];
    agentOffice.forEach((agentOffice) => {
      const data = { ...selectedValues, agentOffice: agentOffice.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.originCountry &&
    [40].includes(Number(selectedValues.expenseParameter))
  ) {
    const country =
      filterData.links.find((link) => link.link_name === 'country')?.data || [];
    country.forEach((country) => {
      const data = { ...selectedValues, country: country.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.taxCategory &&
    [41].includes(Number(selectedValues.expenseParameter))
  ) {
    const taxCategory =
      filterData.links.find((link) => link.link_name === 'taxCategory')?.data ||
      [];
    taxCategory.forEach((taxCategory) => {
      const data = { ...selectedValues, taxCategory: taxCategory.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.importCountry &&
    [41].includes(Number(selectedValues.expenseParameter))
  ) {
    const importCountry =
      filterData.links.find((link) => link.link_name === 'country')?.data || [];
    importCountry.forEach((importCountry) => {
      const data = { ...selectedValues, importCountry: importCountry.value };
      templateData.push(addDataWithLabels(data));
    });
  }
  if (
    !selectedValues.destination &&
    [21].includes(Number(selectedValues.expenseParameter))
  ) {
    const destinationPort =
      filterData.links.find((link) => link.link_name === 'port')?.data || [];
    destinationPort.forEach((destinationPort) => {
      const data = {
        ...selectedValues,
        destinationPort: destinationPort.value,
      };
      templateData.push(addDataWithLabels(data));
    });
  } else {
    templateData.push(addDataWithLabels(selectedValues));
  }

  return templateData.length > 0
    ? templateData
    : [addDataWithLabels(selectedValues)];
};

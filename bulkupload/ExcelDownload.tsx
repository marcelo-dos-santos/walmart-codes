import * as XLSX from 'xlsx';
import { formatDataForExcel } from './ExcelFormatUtils';
import { Options } from '../utils/formInterface';

interface LinkData {
  value: number | string;
  label: string;
}

interface FilterLink {
  link_name: string;
  data: LinkData[];
}

interface FilterData {
  links: FilterLink[];
}

type TransformedValues = {
  [key: string]: number | string | null | undefined;
  market_id: number;
  element_id: number;
  element_subtype_id: number;
  loading_port_id: number;
  entry_port_id: number;
  transport_mode: number;
  container_type_id: number;
  destination_id: any;
  supplier9dvn_id: any;
  agent_office_id: any;
  port_id: any;
  department_id: any;
  container_id: any;
  country_id: any;
  tax_category_id: any;
  import_country_id: any;
  origin_country_id: any;
};

export const downloadRatesToExcel = async (
  transformedValues: {
    market_id: number;
    element_id: number;
    element_subtype_id: number;
    loading_port_id: number;
    entry_port_id: number;
    transport_mode: number;
    container_type_id: number;
    destination_id: any;
    supplier9dvn_id: any;
    agent_office_id: any;
    port_id: any;
    department_id: any;
    container_id: any;
    country_id: any;
    tax_category_id: any;
    import_country_id: any;
    origin_country_id: any;
  },
  filterData: FilterData,
  selectedValues: {
    purchaseCompany?: string;
    expenseType?: string;
    expenseParameter: any;
    transportMode: any;
    containerType?: string;
    loadingPort: any;
    destinationPort?: string;
    entryPort: any;
    supplier9dvn?: string;
    agentOffice: any;
    port?: string;
    destination?: string;
    department: any;
    container: any;
    country?: string;
    taxCategory: any;
    importCountry: any;
    originCountry: any;
  },
  purchaseCompanyOptions: Options[],
  expenseTypeOptions: { value: any; label: string }[],
  expenseParameterOptions: never[],
  fetchAndProcessRates: {
    (
      filterCriteria: { [x: string]: any },
      map: {
        get: (arg0: any) => any;
        keys: () => Iterable<unknown> | ArrayLike<unknown>;
      },
      subtypeId: string | number
    ): Promise<any[]>;
    (arg0: any, arg1: Map<unknown, unknown>, arg2: string): any;
  },
  allData: any[]
) => {
  const baseFilters: TransformedValues = { ...transformedValues };
  Object.keys(baseFilters).forEach((key) => {
    if (baseFilters[key] === '' || baseFilters[key] === 0) {
      delete baseFilters[key];
    }
  });

  const portLink = filterData.links.find(
    (link: { link_name: string }) => link.link_name === 'port'
  );
  const departmentLink = filterData.links.find(
    (link: { link_name: string }) => link.link_name === 'department'
  );
  if (!portLink || !departmentLink) {
    console.error('Required link not found in filter data.');
    return;
  }
  const containerLink = filterData.links.find(
    (link: { link_name: string }) => link.link_name === 'container'
  );
  const transportLink = filterData.links.find(
    (link: { link_name: string }) => link.link_name === 'transportMode'
  );
  const agentOfficeLink = filterData.links.find(
    (link: { link_name: string }) => link.link_name === 'agentOffice'
  );
  const originCountryLink = filterData.links.find(
    (link: { link_name: string }) => link.link_name === 'country'
  );
  const taxCategoryLink = filterData.links.find(
    (link: { link_name: string }) => link.link_name === 'taxCategory'
  );
  const importCountryLink = filterData.links.find(
    (link: { link_name: string }) => link.link_name === 'country'
  );

  const agentOfficeMap = new Map(
    agentOfficeLink?.data.map((item: { value: any; label: any }) => [
      item.value,
      item.label,
    ]) ?? []
  );
  const originCountryMap = new Map(
    originCountryLink?.data.map((item: { value: any; label: any }) => [
      item.value,
      item.label,
    ])
  );
  const taxCategoryMap = new Map(
    taxCategoryLink?.data.map((item: { value: any; label: any }) => [
      item.value,
      item.label,
    ])
  );

  const importCountryMap = new Map(
    importCountryLink?.data.map((item: { value: any; label: any }) => [
      item.value,
      item.label,
    ])
  );
  const transportMap = new Map(
    transportLink?.data.map((trans: { value: any; label: any }) => [
      trans.value,
      trans.label,
    ])
  );
  const containerMap = new Map(
    containerLink?.data.map((cont: { value: any; label: any }) => [
      cont.value,
      cont.label,
    ])
  );
  const departmentMap = new Map(
    departmentLink.data.map((dept: { value: any; label: any }) => [
      dept.value,
      dept.label,
    ])
  );
  const portMap = new Map(
    portLink.data.map((port: { value: any; label: any }) => [
      port.value,
      port.label,
    ])
  );

  try {
    const fetchPromises = [];
    console.log('AllData content:', allData);

    if (
      !selectedValues.loadingPort &&
      [51, 53].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, portMap, 'loading_port_id')
      );
    }

    if (
      !selectedValues.entryPort &&
      [51, 53, 60, 61].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, portMap, 'entry_port_id')
      );
    }

    if (
      !selectedValues.department &&
      [80, 81].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, departmentMap, 'department_id')
      );
    }

    if (
      !selectedValues.container &&
      [51, 53, 61].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, containerMap, 'container_type_id')
      );
    }

    if (
      !selectedValues.transportMode &&
      [51, 53].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, transportMap, 'transport_mode')
      );
    }

    if (
      !selectedValues.agentOffice &&
      [31].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, agentOfficeMap, 'agent_office_id')
      );
    }

    if (
      !selectedValues.originCountry &&
      [40].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, originCountryMap, 'country')
      );
    }

    if (
      !selectedValues.taxCategory &&
      [41].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, taxCategoryMap, 'taxCategory')
      );
    }

    if (
      !selectedValues.importCountry &&
      [41].includes(Number(selectedValues.expenseParameter))
    ) {
      fetchPromises.push(
        fetchAndProcessRates(baseFilters, importCountryMap, 'importCountry')
      );
    }

    const fetchedData = await Promise.all(fetchPromises);
    fetchedData.forEach((dataArray) => allData.push(...dataArray));

    const dataForExport = allData.length > 0 ? allData : [selectedValues];

    exportToExcel(
      formatDataForExcel,
      dataForExport,
      filterData,
      selectedValues,
      purchaseCompanyOptions,
      expenseTypeOptions,
      expenseParameterOptions
    );
  } catch (error) {
    console.error('Error downloading rates:', error);
  }
};

export const exportToExcel = (
  formatDataForExcel: {
    (
      data: any,
      filterData: any,
      selectedValues: any,
      purchaseCompanyOptions: any,
      expenseTypeOptions: any,
      expenseParameterOptions: any
    ): any;
    (arg0: any[], arg1: any, arg2: any, arg3: any, arg4: any, arg5: any): any;
  },
  data: any,
  filterData: any,
  selectedValues: any,
  purchaseCompanyOptions: any,
  expenseTypeOptions: any,
  expenseParameterOptions: any
) => {
  if (!Array.isArray(data)) {
    console.error('Data is not an array');
    return;
  }
  const formattedData = formatDataForExcel(
    data,
    filterData,
    selectedValues,
    purchaseCompanyOptions,
    expenseTypeOptions,
    expenseParameterOptions
  );
  console.log('DATA', data);
  const ws = XLSX.utils.json_to_sheet(formattedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rates');
  XLSX.writeFile(wb, 'rates.xlsx');
};

export const downloadExcelFile = (formattedData: unknown[]) => {
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rates');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(data);
  link.href = url;
  link.download = 'rates_with_remarks.xlsx';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
};

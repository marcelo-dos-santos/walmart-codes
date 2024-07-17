type ResultType = {
  '*Purchase Company'?: string;
  '*Element'?: string;
  '*Factor'?: string;
  '*Loading Port'?: string;
  '*Entry Port'?: string;
  '*Transport Mode'?: string;
  '*Container Type'?: string;
  '*Destination Port'?: string;
  '*Agent Office'?: string;
  '*Department'?: string;
  '*Origin Country'?: string;
  '*Import Country'?: string;
  '*Tax Category'?: string;
  'Effective Date'?: string;
  'Termination Date'?: string;
  'Rate Type'?: string;
  'Rate Value'?: string;
  'Currency Code'?: string;
  'Unit of Measure'?: string;
  'Update User ID'?: string;
  'Create TS'?: string;
  'Update TS'?: string;
};

export const formatDataForExcel = (
  data: any[],
  filterData: { links: any[] },
  selectedValues: {
    purchaseCompany: any;
    expenseType: any;
    expenseParameter: any;
    loadingPort: any;
    entryPort: any;
    transportMode: any;
    container: any;
    destinationPort: any;
    agentOffice: any;
    department: any;
    country: any;
    importCountry: any;
    taxCategory: any;
  },
  purchaseCompanyOptions: any,
  expenseTypeOptions: any,
  expenseParameterOptions: any
) => {
  const findLabelByValue = (linkName: string, value: any) => {
    console.log(`Searching link for: ${linkName} with value: ${value}`);
    const link = filterData.links.find(
      (link: { link_name: any }) => link.link_name === linkName
    );
    console.log(`Link Found:`, link);
    if (!link) {
      console.error(`Link not found for ${linkName}`);
      return 'Label not found';
    }
    const dataEntry = link.data.find((d: { value: any }) => d.value === value);
    console.log(`Data entry found:`, dataEntry);
    return dataEntry ? dataEntry.label : 'Label not found';
  };

  const findLabelInOptions = (
    value: string,
    options: { value: string; label: string }[]
  ) => {
    const foundOption = options.find((option) => option.value === value);
    return foundOption ? foundOption.label : 'Label not found';
  };

  return data.map(
    (entry: {
      loading_port_id: string | string[];
      entry_port_id: any;
      transport_mode: any;
      container_type_id: any;
      destination_port_id: any;
      agent_office_id: any;
      department_id: any;
      origin_country_id: any;
      import_country_id: any;
      tax_category_id: any;
      effective_date: any;
      termination_date: any;
      rate_type: any;
      rate_value: any;
      currency_code: any;
      per_uom_code: any;
      update_user_id: any;
      create_ts: any;
      update_ts: any;
    }) => {
      let result: ResultType = {};

      if (selectedValues.purchaseCompany) {
        result['*Purchase Company'] = findLabelInOptions(
          selectedValues.purchaseCompany,
          purchaseCompanyOptions
        );
      }
      if (selectedValues.expenseType) {
        result['*Element'] = findLabelInOptions(
          selectedValues.expenseType,
          expenseTypeOptions
        );
      }
      if (selectedValues.expenseParameter) {
        result['*Factor'] = findLabelInOptions(
          selectedValues.expenseParameter,
          expenseParameterOptions
        );
      }
      if (selectedValues.loadingPort) {
        result['*Loading Port'] = findLabelByValue(
          'port',
          selectedValues.loadingPort
        );
      }
      if (entry.loading_port_id) {
        if (
          typeof entry.loading_port_id === 'string' &&
          entry.loading_port_id.includes('-')
        ) {
          result['*Loading Port'] = entry.loading_port_id;
        } else {
          result['*Loading Port'] = findLabelByValue(
            'port',
            entry.loading_port_id
          );
        }
      }
      if (selectedValues.entryPort) {
        result['*Entry Port'] = findLabelByValue(
          'port',
          entry.entry_port_id || selectedValues.entryPort
        );
      }
      if (selectedValues.transportMode) {
        result['*Transport Mode'] = findLabelByValue(
          'transportMode',
          entry.transport_mode || selectedValues.transportMode
        );
      }
      if (selectedValues.container) {
        result['*Container Type'] = findLabelByValue(
          'container',
          entry.container_type_id || selectedValues.container
        );
      }
      if (entry.container_type_id && !selectedValues.container) {
        result['*Container Type'] = entry.container_type_id;
      }
      if (selectedValues.destinationPort) {
        result['*Destination Port'] = findLabelByValue(
          'port',
          entry.destination_port_id || selectedValues.destinationPort
        );
      }
      if (selectedValues.agentOffice) {
        result['*Agent Office'] = findLabelByValue(
          'agentOffice',
          entry.agent_office_id || selectedValues.agentOffice
        );
      }

      if (entry.agent_office_id && !selectedValues.agentOffice) {
        result['*Agent Office'] = entry.agent_office_id;
      }

      if (selectedValues.department) {
        result['*Department'] = findLabelByValue(
          'department',
          entry.department_id || selectedValues.department
        );
      }

      if (entry.department_id && !selectedValues.department) {
        result['*Department'] = entry.department_id;
      }

      if (selectedValues.country) {
        result['*Origin Country'] = findLabelByValue(
          'originCountry',
          entry.origin_country_id || selectedValues.country
        );
      }

      if (entry.origin_country_id && !selectedValues.country) {
        result['*Origin Country'] = entry.origin_country_id;
      }

      if (selectedValues.importCountry) {
        result['*Import Country'] = findLabelByValue(
          'importCountry',
          entry.import_country_id || selectedValues.importCountry
        );
      }

      if (entry.import_country_id && !selectedValues.importCountry) {
        result['*Import Country'] = entry.import_country_id;
      }

      if (selectedValues.taxCategory) {
        result['*Tax Category'] = findLabelByValue(
          'taxCategory',
          entry.tax_category_id || selectedValues.taxCategory
        );
      }

      if (entry.tax_category_id && !selectedValues.taxCategory) {
        result['*Tax Category'] = entry.tax_category_id;
      }

      result = {
        ...result,
        'Effective Date': entry.effective_date || 'YYYY-MM-DD',
        'Termination Date': entry.termination_date || 'YYYY-MM-DD',
        'Rate Type': entry.rate_type || '',
        'Rate Value': entry.rate_value || '',
        'Currency Code': entry.currency_code || '',
        'Unit of Measure': entry.per_uom_code || '',
        'Update User ID': entry.update_user_id || '',
        'Create TS': entry.create_ts || '',
        'Update TS': entry.update_ts || '',
      };

      return result;
    }
  );
};

function serialToDate(serial: number) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(
    utc_value * 1000 + new Date().getTimezoneOffset() * 60 * 1000
  );

  const year = date_info.getUTCFullYear();
  const month = (date_info.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date_info.getUTCDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const formatDataForExcelUploaded = (
  displayUploadedRates: any[],
  responseObjects: { [x: string]: any }
) => {
  return displayUploadedRates.map(
    (
      entry: { [x: string]: any; effective_date: any; termination_date: any },
      index: string | number
    ) => {
      const responseObject = responseObjects[index];

      const effectiveDate =
        typeof entry.effective_date === 'number'
          ? serialToDate(entry.effective_date)
          : entry.effective_date;
      const terminationDate =
        typeof entry.termination_date === 'number'
          ? serialToDate(entry.termination_date)
          : entry.termination_date;

      const {
        effective_date: oldEffectiveDate,
        termination_date: oldTerminationDate,
        ...restOfEntry
      } = entry;

      const result = {
        ...restOfEntry,
        'Effective Date': effectiveDate,
        'Termination Date': terminationDate,
        Remarks: responseObject.remarks || '',
      };

      return result;
    }
  );
};

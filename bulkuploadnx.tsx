import React, { useEffect, useState, useRef } from 'react';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ApplyButton } from '../CostFactors/CustomApplyButton';
import * as XLSX from 'xlsx';
import { getEnv, getHeaders } from '../utils/EnvConfig';
import { config } from '../utils/config';
import axios from 'axios';
import AutocompleteSelect from '../CostFactors/AutocompleteSelect';
import { Options } from '../utils/formInterface';
import { moreThanOneDynamicSelectIsEmpty } from './TemplateUtils';
import { downloadRatesToExcel } from './ExcelDownloadUtils';

interface FilterData {
  links: Array<{
    link_name: string;
    data: Array<{
      value: number | string;
      label: string;
    }>;
  }>;
}

interface UploadedRecord {
  rate_value: string | null;
  effective_date: string | null;
  termination_date: string | null;
  rate_type: string | null;
  currency_code: string | null;
  uom_code: string | null;
  market_id: number | null;
  element_id: number | null;
  element_subtype_id: number | null;
  container_type_id: number | null;
  entry_port_id: number | null;
  loading_port_id: number | null;
  transport_mode: number | null;
  destination_id: number;
  agent_office_id: number;
  department_id: number;
  origin_country_id: number;
  import_country_id: number;
  tax_category_id: number;
  update_user_id: string;
}

interface SelectedValues {
  purchaseCompany: string;
  expenseType: string;
  expenseParameter: string;
  transportMode: string;
  containerType: string;
  loadingPort: string;
  destinationPort: string;
  entryPort: string;
  supplier9dvn: string;
  agentOffice: string;
  port: string;
  destination: string;
  department: string;
  container: string;
  country: string;
  taxCategory: string;
  importCountry: string;
  originCountry: string;
}

interface FilterValues {
  market_id: string;
  element_id: string;
  element_subtype_id: string;
  loading_port_id: string;
  entry_port_id: string;
  transport_mode: string;
  container_type_id: string;
  destination_port_id: string;
  supplier9dvn_id: string;
  agent_office_id: string;
  port_id: string;
  destination_id: string;
  department_id: string;
  container_id: string;
  country_id: string;
  tax_category_id: string;
  import_country_id: string;
  origin_country_id: string;
}

type TransformedValues = {
  market_id: number | null;
  element_id: number | null;
  element_subtype_id: number | null;
  loading_port_id: number | null;
  entry_port_id: number | null;
  transport_mode: number | null;
  container_type_id: number | null;
  destination_id: number | null;
  supplier9dvn_id: number | null;
  agent_office_id: number | null;
  port_id: number | null;
  department_id: number | null;
  container_id: number | null;
  country_id: number | null;
  tax_category_id: number | null;
  import_country_id: number | null;
  origin_country_id: number | null;
};

interface LinkOptions {
  [key: string]: { value: string | number; label: string }[];
}

type Payload = TransformedValues & {
  uploadedRates: UploadedRecord[];
  update_user_id: string;
};

interface DropdownConfig {
  displayLabel: string;
  name: keyof SelectedValues;
}

type NewRateType = Payload & {
  row_id: number;
};

type OptionType = {
  value: string;
  label: string;
};

const UploadContainer = styled(Container)({
  width: '100%',
  margin: '16px 0 120px 0',
  borderRadius: '12px',
  border: '1px dashed rgba(144, 145, 150, 1)',
  padding: '16px 0px 8px 0px',
  backgroundColor: 'rgba(248, 248, 248, 1)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  cursor: 'pointer',
});

const SuccessIcon = () => (
  <svg
    width="14"
    height="15"
    viewBox="0 0 14 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5283 4.24623C10.3329 4.05114 10.0163 4.05142 9.82122 4.24685L5.202 8.8731L4.06977 7.61469L4.00366 7.55327C3.81616 7.40821 3.5461 7.4133 3.36364 7.5775C3.15838 7.76222 3.14173 8.07836 3.32645 8.28362L4.8122 9.93457L4.88091 9.99801C5.07597 10.1469 5.35771 10.1337 5.53772 9.95334L10.5289 4.95334L10.5867 4.88404C10.7216 4.68905 10.702 4.41965 10.5283 4.24623Z"
      fill="#1D5F02"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 0.100098C10.866 0.100098 14 3.2341 14 7.1001C14 10.9661 10.866 14.1001 7 14.1001C3.13401 14.1001 0 10.9661 0 7.1001C0 3.2341 3.13401 0.100098 7 0.100098ZM7 1.1001C3.68629 1.1001 1 3.78639 1 7.1001C1 10.4138 3.68629 13.1001 7 13.1001C10.3137 13.1001 13 10.4138 13 7.1001C13 3.78639 10.3137 1.1001 7 1.1001Z"
      fill="#1D5F02"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg
    width="14"
    height="15"
    viewBox="0 0 14 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.88564 0.789035C6.19334 0.173634 6.94166 -0.0758068 7.55706 0.231894C7.75797 0.332351 7.92722 0.484854 8.04782 0.672422L8.1142 0.789035L13.8683 12.2973C14.176 12.9127 13.9266 13.661 13.3112 13.9687C13.1814 14.0336 13.0417 14.0751 12.8984 14.0918L12.754 14.1002H1.24581C0.557766 14.1002 0 13.5424 0 12.8544C0 12.7093 0.0253292 12.5658 0.0744833 12.4301L0.131523 12.2973L5.88564 0.789035ZM7.04747 1.10495C6.96279 1.08821 6.87484 1.11753 6.81714 1.18173L6.78006 1.23625L1.02595 12.7445C1.00888 12.7786 1 12.8162 1 12.8544C1 12.9708 1.08085 13.0682 1.18944 13.0937L1.24581 13.1002H12.754C12.7922 13.1002 12.8298 13.0913 12.864 13.0743C12.9651 13.0237 13.0162 12.9127 12.9953 12.8068L12.9739 12.7445L7.21977 1.23625C7.20392 1.20454 7.18149 1.17682 7.1542 1.15482L7.10985 1.12632L7.04747 1.10495ZM6.99992 10.6002C7.27606 10.6002 7.49992 10.8241 7.49992 11.1002C7.49992 11.3763 7.27606 11.6002 6.99992 11.6002C6.72378 11.6002 6.49992 11.3763 6.49992 11.1002C6.49992 10.8241 6.72378 10.6002 6.99992 10.6002ZM6.99992 4.60021C7.24538 4.60021 7.44953 4.77708 7.49186 5.01033L7.49992 5.10021V9.24091C7.49992 9.51705 7.27606 9.74091 6.99992 9.74091C6.75446 9.74091 6.55031 9.56403 6.50797 9.33078L6.49992 9.24091V5.10021C6.49992 4.82406 6.72378 4.60021 6.99992 4.60021Z"
      fill="#9B1419"
    />
  </svg>
);

const titleStyle = {
  fontFamily: 'Bogle',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '36px',
};

const iconTextStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '16px',
  fontFamily: 'Bogle',
  fontWeight: 400,
  lineHeight: '20px',
  color: 'rgba(46, 47, 50, 1)',
};

const textStyle = {
  fontFamily: 'Bogle',
  fontSize: '14px',
  marginBottom: '8px',
  fontWeight: 400,
  lineHeight: '20px',
  color: 'rgba(46, 47, 50, 1)',
};

const subtitleStyle = {
  fontFamily: 'Bogle',
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: '20px',
  color: 'rgba(46, 47, 50, 1)',
};

const ACCEPTED_FILE_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroenabled.12',
  'text/xml',
  'text/csv',
];

export const BulkUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [ratesData, setRatesData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [allSelectsPopulated, setAllSelectsPopulated] =
    useState<boolean>(false);
  const [uploadedRates, setUploadedRates] = useState<UploadedRecord[]>([]);
  const [displayUploadedRates, setDisplayUploadedRates] = useState<
    UploadedRecord[]
  >([]);
  const [statusMessage, setStatusMessage] = useState('Processing file...');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [purchaseCompanyOptions, setPurchaseCompanyOptions] = useState<
    Options[]
  >([]);
  const [expenseTypeOptions, setExpenseTypeOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [expenseParameterOptions, setExpenseParameterOptions] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [dropdownConfigs, setDropdownConfigs] = useState<DropdownConfig[]>([]);
  const [linkOptions, setLinkOptions] = useState<LinkOptions>({});
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedValues, setSelectedValues] = useState({
    purchaseCompany: '',
    expenseType: '',
    expenseParameter: '',
    transportMode: '',
    containerType: '',
    loadingPort: '',
    destinationPort: '',
    entryPort: '',
    supplier9dvn: '',
    agentOffice: '',
    port: '',
    destination: '',
    department: '',
    container: '',
    country: '',
    taxCategory: '',
    importCountry: '',
    originCountry: '',
  });
  let env: {
    headers: string | number;
  };

  useEffect(() => {
    env = getEnv(config);
  });

  const isMounted = useRef(true);

  const market: { label: string; options: Options[] } = {
    label: 'Purchase Company',
    options: [
      { value: '1001', label: '1001 - WAL-MART INC. USA' },
      { value: '1003', label: '1003 - CMA MEXICO - WBSV' },
    ],
  };

  function updateProgress(currentIndex: number, totalLength: number) {
    setProgress(((currentIndex + 1) / totalLength) * 100);
  }

  const filterValues = {
    market_id: selectedValues.purchaseCompany,
    element_id: selectedValues.expenseType,
    element_subtype_id: selectedValues.expenseParameter,
    loading_port_id: selectedValues.loadingPort,
    entry_port_id: selectedValues.entryPort,
    transport_mode: selectedValues.transportMode,
    container_type_id: selectedValues.container,
    destination_port_id: selectedValues.destinationPort,
    supplier9dvn_id: selectedValues.supplier9dvn,
    agent_office_id: selectedValues.agentOffice,
    port_id: selectedValues.port,
    destination_id: selectedValues.destination,
    department_id: selectedValues.department,
    container_id: selectedValues.container,
    country_id: selectedValues.country,
    tax_category_id: selectedValues.taxCategory,
    import_country_id: selectedValues.importCountry,
    origin_country_id: selectedValues.originCountry,
  };

  function transformSelectedValues(selectedValues: {
    purchaseCompany: string | number;
    expenseType: string | number;
    expenseParameter: string | number;
    transportMode: string | number;
    containerType?: string | number;
    loadingPort: string | number;
    destinationPort: string | number;
    entryPort: string | number;
    supplier9dvn: string | number;
    agentOffice: string | number;
    port: string | number;
    destination?: string | number;
    department: string | number;
    container: string | number;
    country: string | number;
    taxCategory: string | number;
    importCountry: string | number;
    originCountry: string | number;
  }) {
    return {
      market_id: Number(selectedValues.purchaseCompany),
      element_id: Number(selectedValues.expenseType),
      element_subtype_id: Number(selectedValues.expenseParameter),
      loading_port_id: Number(selectedValues.loadingPort),
      entry_port_id: Number(selectedValues.entryPort),
      transport_mode: Number(selectedValues.transportMode),
      container_type_id: Number(selectedValues.container),
      destination_id: Number(selectedValues.destinationPort),
      supplier9dvn_id: Number(selectedValues.supplier9dvn),
      agent_office_id: Number(selectedValues.agentOffice),
      port_id: Number(selectedValues.port),
      department_id: Number(selectedValues.department),
      container_id: Number(selectedValues.container),
      country_id: Number(selectedValues.country),
      tax_category_id: Number(selectedValues.taxCategory),
      import_country_id: Number(selectedValues.importCountry),
      origin_country_id: Number(selectedValues.originCountry),
    };
  }

  function extractNumber(str: string) {
    if (typeof str === 'string') {
      const matches = str.match(/\d+/);
      return matches ? Number(matches[0]) : null;
    }
    return null;
  }

  function isValidDateFormat(dateStr: string) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateStr);
  }

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

  const processFile = (file: File) => {
    if (ACCEPTED_FILE_TYPES.includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target instanceof FileReader) {
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          const parsedData: UploadedRecord[] =
            XLSX.utils.sheet_to_json(worksheet);

          const uniqueRecords = parsedData.filter((record, index, self) => {
            const stringified = JSON.stringify(record);
            return (
              index === self.findIndex((r) => JSON.stringify(r) === stringified)
            );
          });

          const processedDataForDisplay: UploadedRecord[] = [];
          const processedDataForUpload: UploadedRecord[] = [];

          uniqueRecords.forEach((record: any) => {
            let effective_date = record['Effective Date'].toString();
            let termination_date = record['Termination Date'].toString();

            if (!isValidDateFormat(effective_date)) {
              effective_date = serialToDate(record['Effective Date']);
            }

            if (!isValidDateFormat(termination_date)) {
              termination_date = serialToDate(record['Termination Date']);
            }

            processedDataForUpload.push({
              market_id: extractNumber(record['*Purchase Company']) || 0,
              element_id: extractNumber(record['*Element']) || 0,
              element_subtype_id: extractNumber(record['*Factor']) || 0,
              loading_port_id: extractNumber(record['*Loading Port']) || 0,
              transport_mode: extractNumber(record['*Transport Mode']) || 0,
              entry_port_id: extractNumber(record['*Entry Port']) || 0,
              container_type_id: extractNumber(record['*Container Type']) || 0,
              destination_id: extractNumber(record['*Destination Port']) || 0,
              agent_office_id: extractNumber(record['*Agent Office']) || 0,
              department_id: extractNumber(record['*Department']) || 0,
              origin_country_id: extractNumber(record['*Origin Country']) || 0,
              import_country_id: extractNumber(record['*Import Country']) || 0,
              tax_category_id: extractNumber(record['*Tax Category']) || 0,
              rate_value: record['Rate Value'] || 0,
              effective_date: effective_date || 0,
              termination_date: termination_date || 0,
              currency_code: record['Currency Code'] || 0,
              rate_type: record['Rate Type'] || 0,
              uom_code: record['Unit of Measure'] || 0,
              update_user_id: record['Update User ID'] || 0,
            });

            processedDataForDisplay.push({
              ...record,
              effective_date: effective_date,
              termination_date: termination_date,
            });
          });

          setUploadedRates((prevUploadedRates) => {
            const newUploadedRates = [
              ...prevUploadedRates,
              ...processedDataForUpload,
            ];
            return newUploadedRates;
          });

          setDisplayUploadedRates((prevDisplayUploadedRates) => {
            const newDisplayUploadedRates = [
              ...prevDisplayUploadedRates,
              ...processedDataForDisplay,
            ];
            return newDisplayUploadedRates;
          });
        }
      };
      reader.readAsBinaryString(file);
    } else {
      if (setSnackbarMessage) {
        setSnackbarMessage(
          'Invalid file type. Please upload XLS, XLSM, XLSX, XML, or CSV files only.'
        );
      }
      if (setSnackbarOpen) {
        setSnackbarOpen(true);
      }
      if (setSelectedFile) {
        setSelectedFile(null);
      }
    }
  };

  const isRateActive = (rate: {
    termination_date: string | number | Date | null;
  }) => {
    if (rate.termination_date === null) {
      return false;
    }
    const today = new Date();
    const terminationDate = new Date(rate.termination_date);
    return terminationDate >= today;
  };

  const areAll3SelectsPopulated =
    selectedValues.purchaseCompany &&
    selectedValues.expenseType &&
    selectedValues.expenseParameter;

  const handleSelectChange = (
    event: { target: { value: string | number } },
    fieldName: string
  ) => {
    const newValue = event ? event.target.value : '';

    setSelectedValues((prevSelectedValues) => {
      const updatedValues = { ...prevSelectedValues, [fieldName]: newValue };

      if (fieldName === 'purchaseCompany') {
        setIsLoadingApi(true);
        setTimeout(() => setIsLoadingApi(false), 1500);
        if (newValue) {
          updatedValues.expenseType = '';
          updatedValues.expenseParameter = '';
          dropdownConfigs.forEach((config) => {
            if (prevSelectedValues[config.name]) {
              updatedValues[config.name] = '';
            }
          });
        } else {
          setIsLoadingApi(false);
          setExpenseTypeOptions([]);
          setExpenseParameterOptions([]);
        }
      } else if (fieldName === 'expenseType') {
        updatedValues.expenseParameter = '';
        setRatesData([]);
        dropdownConfigs.forEach((config) => {
          if (prevSelectedValues[config.name]) {
            updatedValues[config.name] = '';
          }
        });
      } else if (fieldName === 'expenseParameter') {
        setRatesData([]);
        dropdownConfigs.forEach((config) => {
          if (prevSelectedValues[config.name]) {
            updatedValues[config.name] = '';
          }
        });
      }

      return updatedValues;
    });
  };

  const openFileDialog = () => {
    const input: HTMLElement | null = document.getElementById('fileInput');
    input && input.click();
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const transformedValues = transformSelectedValues(selectedValues);

  const payload: Payload = {
    ...transformedValues,
    uploadedRates,
    update_user_id: 'mfromer',
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key as keyof Payload] === '') {
      delete payload[key as keyof Payload];
    }
  });

  const handleFileUpload = async (uploadedRates: UploadedRecord[]) => {
    setIsCalculating(true);
    setUploadProgress(0);

    const numberOfRows = uploadedRates.length;
    const secondsPerRow = 2;
    const uploadDuration = numberOfRows * secondsPerRow * 1000;
    const updateInterval = 200;
    let progress = 0;
    const totalUpdates = uploadDuration / updateInterval;
    const progressStep = 100 / totalUpdates;

    const progressInterval = setInterval(() => {
      if (isMounted.current) {
        progress += progressStep;
        setUploadProgress(Math.round(progress));
        setStatusMessage('Processing file...');
        if (Math.round(progress) >= 50) {
          setStatusMessage('Uploading data...');
        }
        if (progress >= 100) {
          clearInterval(progressInterval);
          setUploadComplete(true);
          setIsCalculating(false);
          setIsUploading(false);
        }
      }
    }, updateInterval);

    try {
      await new Promise((resolve) => setTimeout(resolve, uploadDuration));
      const responseObjects: NewRateType[] = [];

      uploadedRates.forEach((rate: UploadedRecord, index: number) => {
        const newRate: NewRateType = {
          ...payload,
          row_id: index + 1,
          ...rate,
        };

        Object.keys(newRate).forEach((key) => {
          if (newRate[key as keyof NewRateType] === '') {
            delete newRate[key as keyof NewRateType];
          }
        });

        responseObjects.push(newRate);
      });

      const response = await axios.post(
        'https://gst-cost-service.dev.walmart.com/ratemgmt/rates/ratelist',
        responseObjects,
        {
          headers: getHeaders(env),
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 1;
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (response.status === 200) {
        console.log('Upload complete:', response.data);
        const successResponses = response.data.data.filter(
          (item: { status: string }) => item.status === 'SUCCESS'
        ).length;
        const errorResponses = response.data.data.filter(
          (item: { status: string }) => item.status.startsWith('FAILURE')
        );

        setSuccessCount(successResponses);
        setErrorCount(errorResponses.length);

        if (errorResponses.length > 0) {
          const errorMessages = errorResponses
            .map((item: { status: string | number }) => item.status)
            .join('; ');
          setSnackbarMessage('Upload Failed: ' + errorMessages);
          setSnackbarOpen(true);
          setUploadFailed(true);
        } else {
          setUploadComplete(true);
        }
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      console.error('Error trying to upload:', error);
      setSnackbarMessage('Upload failed. Please try again.');
      setSnackbarOpen(true);
      setUploadFailed(true);
    } finally {
      setIsCalculating(false);
      setIsUploading(false);
    }
  };

  async function fetchAndProcessRates(
    filterCriteria: { [x: string]: any },
    map: {
      get: (arg0: any) => any;
      keys: () => Iterable<unknown> | ArrayLike<unknown>;
    },
    subtypeId: string | number
  ) {
    const rates = [];

    if (filterCriteria[subtypeId]) {
      try {
        const filters = { ...filterCriteria };
        const response = await axios.post(
          'https://gst-cost-service.dev.walmart.com/ratemgmt/rates/getratelist',
          filters,
          {
            headers: getHeaders(env),
          }
        );
        if (response.data && response.data.data) {
          rates.push(
            ...response.data.data.map(
              (rate: { [x: string]: string | number }) => ({
                ...rate,
                [subtypeId]: map.get(rate[subtypeId]) || rate[subtypeId],
              })
            )
          );
        }
      } catch (error) {
        console.error(
          `Error fetching rates for ${subtypeId}: ${filterCriteria[subtypeId]}`,
          error
        );
      }
    } else {
      const validIds = Array.from(map.keys());
      for (let i = 0; i < validIds.length; i++) {
        const id = validIds[i];
        const filters = { ...filterCriteria, [subtypeId]: id };
        try {
          const response = await axios.post(
            'https://gst-cost-service.dev.walmart.com/ratemgmt/rates/getratelist',
            filters,
            {
              headers: getHeaders(env),
            }
          );
          if (response.data && response.data.data) {
            const activeRates = response.data.data.filter(
              (rate: UploadedRecord) => isRateActive(rate)
            );
            rates.push(
              ...activeRates.map((rate: { [x: string]: string | number }) => ({
                ...rate,
                [subtypeId]: map.get(rate[subtypeId]) || rate[subtypeId],
              }))
            );
          }
        } catch (error) {
          console.error(`Error fetching rates for ID: ${id}`, error);
        }
        updateProgress(i, validIds.length);
      }
    }

    setProgress(0);
    return rates;
  }

  async function fetchRates(filterValues: {
    market_id: string;
    element_id: string;
    element_subtype_id: string;
    loading_port_id: string;
    entry_port_id: string;
    transport_mode: string;
    container_type_id: string;
    destination_port_id: string;
    supplier9dvn_id: string;
    agent_office_id: string;
    port_id: string;
    destination_id: string;
    department_id: string;
    container_id: string;
    country_id: string;
    tax_category_id: string;
    import_country_id: string;
    origin_country_id: string;
  }) {
    if (!allSelectsPopulated) return;
    const headers = getHeaders(env);
    const payload: FilterValues = { ...filterValues };
    const filteredPayload: Partial<FilterValues> = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== '') {
        filteredPayload[key as keyof FilterValues] =
          value as FilterValues[keyof FilterValues];
      }
    });
    try {
      const { data } = await axios.post(
        'https://gst-cost-service.dev.walmart.com/ratemgmt/rates/getratelist',
        payload,
        { headers }
      );

      if (data && data.data) {
        const activeRates = data.data.filter(
          (rate: { termination_date: string | number | Date | null }) =>
            isRateActive(rate)
        );
        setRatesData(activeRates);
      } else {
        setRatesData([]);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      setRatesData([]);
    }
  }

  const handleCloseSnackbar = (event: unknown, reason: string) => {
    if (reason !== 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
      processFile(file);
    }
  };

  const handleDownloadClick = () => {
    if (
      !selectedValues.purchaseCompany ||
      !selectedValues.expenseType ||
      !selectedValues.expenseParameter ||
      filterData === null
    ) {
      setSnackbarMessage('Please, fill all selects before download template');
      setSnackbarOpen(true);
      return;
    }

    downloadRatesToExcel(
      transformSelectedValues(selectedValues),
      filterData,
      selectedValues,
      purchaseCompanyOptions,
      expenseTypeOptions,
      expenseParameterOptions,
      fetchAndProcessRates,
      ratesData
    );
  };

  const handleUploadAnotherFile = () => {
    setSelectedFile(null);
    setUploadComplete(false);
    setUploadProgress(0);
    setSuccessCount(0);
    setErrorCount(0);
    setStatusMessage('Processing file...');
    setUploadFailed(false);
  };

  const getDropdownsConfig = (selectedValues: any, filterData: any): any[] => {
    const { purchaseCompany, expenseType, expenseParameter } = selectedValues;

    if (!filterData || !filterData.elements) {
      return [];
    }

    const selectedExpense = filterData.elements.find(
      (el: any) => el.element_id === expenseType
    );

    if (!selectedExpense || !selectedExpense.factors) {
      return [];
    }

    const selectedFactor = selectedExpense.factors.find(
      (f: any) => f.subtype_id === expenseParameter
    );

    if (!selectedFactor || !selectedFactor.filters) {
      return [];
    }

    return selectedFactor.filters;
  };

  type DropdownToApiLinkMap = {
    [key: string]: string;
  };
  const dropdownToApiLinkMap: DropdownToApiLinkMap = {
    loadingPort: 'port',
    originCountry: 'country',
    entryPort: 'port',
    importCountry: 'country',
    destination: 'port',
  };
  const getOptionsForDropdown = (dropdownName: string) => {
    const apiLinkName = dropdownToApiLinkMap[dropdownName] || dropdownName;
    return linkOptions[apiLinkName] || [];
  };

  useEffect(() => {
    if (uploadedRates.length > 0 && displayUploadedRates.length > 0) {
      handleFileUpload(uploadedRates);
    }
  }, [uploadedRates, displayUploadedRates]);

  useEffect(() => {
    if (selectedValues.purchaseCompany) {
      fetchFilters();
    }
  }, [selectedValues.purchaseCompany]);

  async function fetchFilters() {
    const headers = getHeaders(env);

    const params = {
      market_id: selectedValues.purchaseCompany,
    };

    try {
      const { data } = await axios.get(
        'https://gst-cost-service.dev.walmart.com/ratemgmt/filters',
        {
          params: {
            market_id: selectedValues.purchaseCompany,
          },
          headers: headers,
        }
      );
      setFilterData(data);
    } catch (error) {
      console.error('Error trying to fetch filters:', error);
    } finally {
      setTimeout(() => {
        setIsLoadingApi(false);
      }, 1500);
    }
  }

  useEffect(() => {
    const configs = getDropdownsConfig(selectedValues, filterData);
    setDropdownConfigs(configs);
  }, [selectedValues, filterData]);

  useEffect(() => {
    setPurchaseCompanyOptions(market.options);
  }, []);

  useEffect(() => {
    const dataWithElements = filterData as { elements?: any[] };
    if (dataWithElements && dataWithElements.elements) {
      const types = dataWithElements.elements.map((el) => ({
        value: el.element_id,
        label: `${el.element_id} - ${el.element_name}`,
      }));
      setExpenseTypeOptions(types);
    }
  }, [filterData]);

  useEffect(() => {
    const dataWithElements = filterData as { elements?: any[] };
    if (dataWithElements?.elements && selectedValues.expenseType) {
      const selectedExpense = dataWithElements.elements.find(
        (el) => el.element_id === selectedValues.expenseType
      );
      if (selectedExpense && selectedExpense.factors) {
        const parameters = selectedExpense.factors.map(
          (f: { subtype_id: any; subtype_name: any }) => ({
            value: f.subtype_id,
            label: `${f.subtype_id} - ${f.subtype_name}`,
          })
        );
        setExpenseParameterOptions(parameters);
      } else {
        setExpenseParameterOptions([]);
      }
    }
  }, [filterData, selectedValues.expenseType]);

  useEffect(() => {
    console.log(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    console.log(isUploading);
  }, [selectedFile]);

  useEffect(() => {
    if (filterData && filterData.links) {
      const tempLinkOptions: LinkOptions = {};

      filterData.links.forEach((link) => {
        tempLinkOptions[link.link_name] = link.data.map((item) => ({
          value: String(item.value),
          label: item.label,
        }));
      });

      setLinkOptions(tempLinkOptions);
    }
  }, [filterData]);

  useEffect(() => {
    const areInitialSelectsPopulated =
      selectedValues.purchaseCompany &&
      selectedValues.expenseType &&
      selectedValues.expenseParameter;

    const areDynamicSelectsPopulated = dropdownConfigs.every(
      (config) => selectedValues[config.name]
    );

    setAllSelectsPopulated(
      areInitialSelectsPopulated && areDynamicSelectsPopulated ? true : false
    );
  }, [dropdownConfigs, selectedValues]);

  const lastFetchedFiltersRef = useRef({});

  useEffect(() => {
    const allSelectsFilled =
      selectedValues.purchaseCompany &&
      selectedValues.expenseType &&
      selectedValues.expenseParameter &&
      dropdownConfigs.every((config) => selectedValues[config.name]);

    const currentFilterValues = JSON.stringify(filterValues);
    const lastFetchedFilterValues = lastFetchedFiltersRef.current;

    if (allSelectsFilled && currentFilterValues !== lastFetchedFilterValues) {
      setIsFetching(true);
      fetchRates(filterValues)
        .then(() => {
          lastFetchedFiltersRef.current = currentFilterValues;
        })
        .catch((error) => {
          console.error('Error fetching rates:', error);
        })
        .finally(() => {
          setTimeout(() => {
            setIsFetching(false);
          }, 2000);
        });
    }
  }, [selectedValues, dropdownConfigs, filterValues]);

  useEffect(() => {
    const dataWithElements = filterData as { elements?: any[] };
    if (dataWithElements && dataWithElements.elements) {
      const types = dataWithElements.elements.map((el) => ({
        value: el.element_id,
        label: `${el.element_id} - ${el.element_name}`,
      }));
      setExpenseTypeOptions(types);
    }
  }, [filterData]);

  return (
    <>
      <div style={{ marginTop: '7%' }}>
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 1)',
            padding: 2,
            minWidth: '1136px',
            minHeight: '360px',
            margin: 'auto',
            overflow: 'auto',
            boxShadow:
              '0px 1px 2px 1px rgba(0, 0, 0, 0.15), 0px -1px 2px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography sx={{ ...titleStyle, marginBottom: '25px' }}>
            Bulk Upload Rates
          </Typography>
          <Box sx={subtitleStyle}>
            Steps of bulk upload rates:
            <ol>
              <li style={textStyle}>
                Begin by selecting the Purchase company, Element, Factor and
                others filters. Then, download the provided template.
              </li>
              <li style={textStyle}>
                Utilize our template to import the line items required for the
                uploading rates (max size 10mb items/file).
              </li>
              <li style={textStyle}>
                Upload the completed rates file below, and our system will
                initiate the uploading automatically. Avoid refreshing the page
                during this process.
              </li>
              <li style={textStyle}>
                After the uploading is finished, the resulting rate will be
                available.
              </li>
            </ol>
          </Box>
          <Divider />
          {progress > 0 && (
            <LinearProgress variant="determinate" value={progress} />
          )}
          <Divider />
          <Grid container spacing={2} alignItems="center">
            <AutocompleteSelect
              label="Purchase company"
              options={purchaseCompanyOptions as OptionType[]}
              selectedValue={selectedValues.purchaseCompany}
              onChange={handleSelectChange}
              name="purchaseCompany"
            />
            <AutocompleteSelect
              label="Element"
              options={expenseTypeOptions}
              selectedValue={selectedValues.expenseType}
              onChange={handleSelectChange}
              name="expenseType"
            />
            <AutocompleteSelect
              label="Factor"
              options={expenseParameterOptions}
              selectedValue={selectedValues.expenseParameter}
              onChange={handleSelectChange}
              name="expenseParameter"
            />
            <Grid
              item
              xs={12}
              sm={3}
              display="flex"
              alignItems="center"
              justifyContent="center"
              marginTop="40px"
            >
              <Button
                variant="contained"
                onClick={handleDownloadClick}
                disabled={moreThanOneDynamicSelectIsEmpty(
                  dropdownConfigs,
                  selectedValues
                )}
                sx={{
                  height: '56px',
                  borderRadius: '40px',
                  backgroundColor: '#0052cc',
                  color: '#ffffff',
                  padding: '0 30px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#0041b3',
                  },
                  boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
                }}
              >
                Download Template
              </Button>
            </Grid>
          </Grid>
          {areAll3SelectsPopulated && (
            <>
              <Grid container spacing={2} direction="row">
                {dropdownConfigs.map((config, index) => (
                  <AutocompleteSelect
                    key={config.name}
                    label={config.displayLabel}
                    options={getOptionsForDropdown(config.name)}
                    selectedValue={selectedValues[config.name]}
                    onChange={handleSelectChange}
                    name={config.name}
                  />
                ))}
              </Grid>
            </>
          )}
        </Box>
        {isCalculating ? (
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: '0px 1px 2px 1px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              padding: 2,
              margin: '16px 0',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ ...titleStyle, marginBottom: '25px', display: 'flex' }}
            >
              Uploading in progress...
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '10px',
              }}
            >
              <Typography
                variant="body2"
                sx={{ ...textStyle, fontSize: '16px' }}
              >
                {statusMessage}
              </Typography>
              <Typography sx={{ ...textStyle, fontSize: '16px' }}>
                {uploadProgress}%
              </Typography>
            </div>
            <Divider sx={{ my: 2 }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
              }}
            >
              <ApplyButton onClick={handleUploadAnotherFile} disabled>
                Upload another file
              </ApplyButton>
            </div>
          </Box>
        ) : uploadFailed ? (
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: '0px 1px 2px 1px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              padding: 2,
              margin: '16px 0',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography
              variant="h6"
              sx={{ ...titleStyle, marginBottom: '25px', display: 'flex' }}
            >
              File upload failed.
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'rgba(222, 28, 36, 1)',
                },
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '10px',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  ...textStyle,
                  fontSize: '16px',
                  display: 'flex',
                  marginTop: '15px',
                }}
              >
                File upload failed. Go back to the upload file page and try
                again.
              </Typography>
              <Typography sx={{ ...textStyle, fontSize: '16px' }}>
                {uploadProgress}%
              </Typography>
            </div>
            <Divider sx={{ my: 2 }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
              }}
            >
              <ApplyButton
                data-cy="tryagainButton"
                onClick={handleUploadAnotherFile}
              >
                Try again
              </ApplyButton>
            </div>
          </Box>
        ) : uploadComplete ? (
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: '0px 1px 2px 1px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              padding: 2,
              margin: '16px 0',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ ...titleStyle, marginBottom: '25px', display: 'flex' }}
            >
              Your rates was uploaded.
            </Typography>
            <LinearProgress
              variant="determinate"
              value={100}
              sx={{
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'rgba(42, 135, 3, 1)',
                },
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                gap: '20px',
                alignItems: 'center',
                margin: '10px',
              }}
            >
              <Box sx={iconTextStyle}>
                <SuccessIcon />
                <Typography>{successCount} rates uploaded</Typography>
              </Box>
              <Box sx={iconTextStyle}>
                <ErrorIcon />
                <Typography>{errorCount} error found</Typography>
              </Box>
            </div>
            <Divider sx={{ my: 2 }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                width: '100%',
              }}
            >
              <ApplyButton onClick={handleUploadAnotherFile}>
                Upload another file
              </ApplyButton>
            </div>
          </Box>
        ) : (
          <UploadContainer
            data-cy="upload-container"
            onClick={openFileDialog}
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20.6129 17.2097L20.7071 17.2929L23.7071 20.2929C24.0976 20.6834 24.0976 21.3166 23.7071 21.7071C23.3466 22.0676 22.7794 22.0953 22.3871 21.7903L22.2929 21.7071L21 20.415V28L20.9933 28.1166C20.9355 28.614 20.5128 29 20 29C19.4872 29 19.0645 28.614 19.0067 28.1166L19 28V20.415L17.7071 21.7071C17.3466 22.0676 16.7794 22.0953 16.3871 21.7903L16.2929 21.7071C15.9324 21.3466 15.9047 20.7794 16.2097 20.3871L16.2929 20.2929L19.2929 17.2929C19.6534 16.9324 20.2206 16.9047 20.6129 17.2097ZM16.9308 3C21.6473 3 25.5665 6.57236 26.1903 11.2362L26.214 11.436L26.3662 11.5182C28.5001 12.7237 29.9009 14.9922 29.9949 17.536L30 17.8095C30 21.702 27.0176 24.8684 23.2373 24.996L23 25V23C25.7717 23 28 20.6936 28 17.8095C28 15.6856 26.7481 13.8039 24.8749 13.0096C24.5223 12.86 24.2861 12.5222 24.2666 12.1396C24.0636 8.14273 20.8381 5 16.9308 5C13.1693 5 10.0193 7.91892 9.62686 11.7359C9.57714 12.2195 9.18678 12.5973 8.70179 12.6312C6.06799 12.8151 4 15.0714 4 17.8095C4 20.6076 6.15155 22.8807 8.83719 22.9955L9.05029 23H17V25H9.05029C5.15133 25 2 21.7757 2 17.8095C2 14.3572 4.39514 11.4438 7.61986 10.7671L7.751 10.741C8.56407 6.39214 12.2503 3.13005 16.6651 3.0038L16.9308 3Z"
                fill="black"
              />
            </svg>
            <p style={textStyle}>Drag and drop file here</p>
            <ApplyButton>Click to upload</ApplyButton>
            <p style={textStyle}>
              File Types: XLS, XLSM, XLSX, XML, CSV. <br /> Max size: 10 MB
            </p>
          </UploadContainer>
        )}
        <input
          type="file"
          id="fileInput"
          data-cy="fileInput"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".xls,.xlsm,.xlsx,.xml,.csv"
        />
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
        />
        {isLoadingApi && (
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={isLoadingApi}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        )}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isFetching}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </div>
    </>
  );
};

export default BulkUpload;

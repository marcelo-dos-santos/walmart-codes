import { Container, styled } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { ApplyButton } from '../CostFactors/CustomApplyButton';
import ProgressBarComponent from './ProgressBarComponent';
import * as XLSX from 'xlsx';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Tag,
} from '@walmart-web/livingdesign-components';
import axios, { AxiosError } from 'axios';
import { estimationsResponse } from '../utils/reponseData';
import { getEnv, getHeaders } from '../utils/EnvConfig';
import { config } from '../utils/config';
import { v4 as uuidv4 } from 'uuid';
import saveAs from 'file-saver';
import { convertKey } from '../assets';
import { Icon } from '@livingdesign/icons';
import { handleRequestParams } from '../utils/requestData';
import { getEnvironmentInfo } from '../environments/auth.service';
import {
  CCMConfig,
  ICCMConfig,
  Startup,
  WmtAxiosWrapper,
} from '@gs-mso/startup';

interface IUmsUserInfoDTO {
  loginId: string;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    loginId: string;
    displayName: string;
    domain: string;
    ldapGroup: string[];
    contactInfo: {
      emailInfo: {
        emailId: string;
        verified: boolean;
      };
      phoneInfo: string;
    };
    partnerInfo: unknown[];
    state: string;
    isInternal: boolean;
  };
  id: string;
}

type MfeConfigType = {
  configResolution: {
    resolved: {
      market: string;
      costFiltersURL: string;
      costServiceURL: string;
      rateMaintainanceEnable: boolean;
      apiVersion: number;
      mfeCostingUrl: string;
      bulkUploadEnable: boolean;
      supplier: string;
      costMultipleEnable: boolean;
    };
  };
};

const UploadContainer = styled(Container)({
  width: '1136px',
  height: '198px',
  margin: '16px 0 24px 0',
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

const textStyle = {
  fontFamily: 'Bogle',
  fontSize: '14px',
  fontWeight: 400,
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

export interface UploadBulkFilesProps {
  supplier: string;
  market: string;
}

type Payload = {
  [key: string]: any;
};

interface ErrorResponse {
  error?: {
    error_message?: string;
  };
}

interface ResponseData {
  [key: string | number]: any;
}

const UploadBulkFiles: React.FC<UploadBulkFilesProps> = ({ supplier }) => {
  const [fileProcessingProgress, setFileProcessingProgress] = useState(0);
  const [userInfo, setUserInfo] = React.useState<IUmsUserInfoDTO | null>(null);
  const [, setCCMValues] = React.useState<MfeConfigType>();
  const [error, setError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorCount, setErrorCount] = useState('');
  const [successCount, setSuccessCount] = useState('');
  const [unexpectedError, setUnexpectedError] = useState('');
  let env: {
    [x: string]: string;
    headers: any;
  };

  useEffect(() => {
    env = getEnv(config);
  });

  React.useEffect(() => {
    const ccmConfigObject: ICCMConfig = {
      applicationBaseUrlKey: 'costFiltersURL',
      ccmBasePaths: {
        devUrl: 'https://gst-cost-ui-nx.dev.walmart.com/etc/config/',
        stgUrl: 'gst-cost-ui-nx.stg.walmart.com/etc/config/',
        prodUrl: 'https://<your-apps-CNAME>/etc/config/',
      },
      ccmConfigDefinitionNames: ['mfeConfig'],
      appConfigKey: 'mfeConfig',
    };

    const ccmConfig: CCMConfig = new CCMConfig(ccmConfigObject);
    const startup = new Startup();

    startup.init(ccmConfig).then(() => {
      console.log(WmtAxiosWrapper.ccm);
      setCCMValues(WmtAxiosWrapper.ccm as MfeConfigType);
      WmtAxiosWrapper.authWrapper.getUserInfo().then((userData: any) => {
        console.log(userData);
        setUserInfo(userData);
      });
    });
  }, []);

  const environment = getEnvironmentInfo();

  const getId = (value: string) => {
    return typeof value == 'string' && value.indexOf('-') > -1
      ? value.split('-')[0].trim()
      : value;
  };

  const convertExcelToPayload = (json: { [key: string]: string }): Payload => {
    const newJson: Payload = {};
    for (const key in json) {
      if (key.includes('.')) {
        const newKey = convertKey(key).split('.');
        if (!newJson[newKey[1]]) {
          newJson[newKey[1]] = {};
        }
        newJson[newKey[1]][newKey[0].replace('*', '')] = getId(json[key]);
      } else {
        newJson[convertKey(key).replace('*', '')] = getId(json[key]);
      }
    }
    return newJson;
  };

  async function estimations(request: any, source: any) {
    try {
      const { data } = await axios.post<estimationsResponse>(
        `${environment.gstCostApiBaseUrl}/costs/estimations`,
        { ...request, source },
        {
          headers: getHeaders(env),
        }
      );
      setError('');
      return data.data.costs;
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axios.isAxiosError(axiosError)) {
        const responseData = axiosError.response?.data;
        if (
          responseData &&
          typeof responseData === 'object' &&
          'error' in responseData &&
          responseData.error?.error_message
        ) {
          const errorMessage = responseData.error?.error_message;
          return errorMessage ? errorMessage : responseData;
        } else {
          return responseData;
        }
      } else {
        console.log('entered 2');
        setFileProcessingProgress(50);
        setUnexpectedError(
          'An error occurred during calculation. Go back to the upload file page and try again.'
        );
        return 'An unexpected error occurred.';
      }
    }
  }

  const processFile = async (file: File) => {
    if (ACCEPTED_FILE_TYPES.includes(file.type)) {
      setIsCalculating(true);
      setFileProcessingProgress(25);
      setStatusMessage('Uploading file...');
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const ref = worksheet['!ref'] || 'A1';
        const range = XLSX.utils.decode_range(ref);
        range.s.r = 2;
        // range.e.c = XLSX.utils.decode_col('U');
        const jsonArray: { key: string; value: string }[] =
          XLSX.utils.sheet_to_json(worksheet, {
            range: range,
            blankrows: false,
          });
        await getExcelData(jsonArray);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setFileProcessingProgress(25);
      setError(
        'Invalid file type. Please upload XLS, XLSM, XLSX, XML, or CSV files only.'
      );
    }
  };

  const handleDownload = async (requestDataArray: any[]) => {
    let eCount = 0;
    let sCount = 0;
    let source: { [key: string]: any } = {};
    let reqResComb = {};
    let responseOutput: any;
    const jsonDataArray: any[] = [];

    const loginId = userInfo?.loginId;
    const userId = loginId?.split('\\')[1];
    const uuid = uuidv4();
    source = {
      source_id: userId || null,
      source_name: 'gst-costManagement-ui',
      source_trace_id: uuid,
    };

    await Promise.allSettled(
      requestDataArray.map(async (request: { [x: string]: string }) => {
        const responseData: ResponseData = {};
        const payload = convertExcelToPayload(request);
        const payloadRequest = handleRequestParams(payload, supplier);

        if (payloadRequest?.idc_handling_type) {
          payloadRequest['is_flow'] =
            payloadRequest?.idc_handling_type == 'Storage' ? false : true;
        }

        if (payloadRequest.pack.volume_uom === 'Meters') {
          payloadRequest.pack.volume_uom = 'CR';
        } else if (payloadRequest.pack.volume_uom === 'Inches') {
          payloadRequest.pack.volume_uom = 'CI';
        }

        //response part
        responseOutput = await estimations(payloadRequest, source);
        if (typeof responseOutput == 'object') {
          sCount += 1;
          responseOutput.forEach(
            (cost: {
              cost_elements: any[];
              description: string | number;
              value: any;
            }) => {
              if (cost.cost_elements?.length > 0) {
                cost.cost_elements.forEach(
                  (ele: {
                    cost_elements: any[];
                    description: string | number;
                    amount: any;
                  }) => {
                    if (ele.cost_elements?.length > 0) {
                      ele.cost_elements.forEach(
                        (subEle: {
                          description: string | number;
                          amount: any;
                        }) => {
                          responseData[subEle.description] = subEle.amount;
                        }
                      );
                    }
                    responseData[ele.description] = ele.amount;
                  }
                );
              }
              responseData[cost.description] = cost.value;
            }
          );
        } else if (typeof responseOutput == 'string') {
          eCount += 1;
          responseData['error'] = responseOutput;
        }

        reqResComb = { ...request, ...responseData };
        jsonDataArray.push(reqResComb);

        setErrorCount(`${eCount} error found`);
        setSuccessCount(`${sCount} items success`);

        console.log(jsonDataArray.length === requestDataArray.length);

        if (
          jsonDataArray.length > 0 &&
          jsonDataArray.length === requestDataArray.length
        ) {
          console.log(jsonDataArray.length);

          const ws = XLSX.utils.json_to_sheet(jsonDataArray);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          const excelBuffer = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
          });
          const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
          });
          saveAs(blob, 'MultiLineLandedCost.xlsx');
          setIsCalculating(false);
          setStatusMessage(
            'Your file is ready and has been automatically downloaded'
          );
          setFileProcessingProgress(100);
        }
      })
    );
  };

  const getExcelData = async (
    requestDataArray: { key: string; value: string }[]
  ) => {
    setFileProcessingProgress(50);
    setStatusMessage('Calculating costs...');
    handleDownload(requestDataArray);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadAnother = () => {
    setIsCalculating(false);
    setFileProcessingProgress(0);
    setError('');
    setErrorCount('');
    setSuccessCount('');
    setStatusMessage('');
  };

  return (
    <>
      {isCalculating ? (
        <Card size="large">
          <CardHeader title="Calculating in progress..." />
          <CardContent>
            <ProgressBarComponent
              label={statusMessage}
              value={fileProcessingProgress}
              variant="info"
            />
          </CardContent>
          <CardActions>
            <ApplyButton disabled>Calculate another file</ApplyButton>
          </CardActions>
        </Card>
      ) : fileProcessingProgress === 100 ? (
        <Card size="large">
          <CardHeader title={statusMessage} />
          <CardContent>
            <ProgressBarComponent
              label=" "
              value={fileProcessingProgress}
              variant="success"
            />
            <span>
              <Tag
                color="green"
                leading={<Icon name="CheckCircle" size="small" />}
                variant="secondary"
              >
                {successCount}
              </Tag>
              <Tag
                color="red"
                leading={<Icon name="Warning" size="small" />}
                variant="secondary"
              >
                {errorCount}
              </Tag>
            </span>
          </CardContent>
          <CardActions>
            <ApplyButton onClick={handleUploadAnother}>
              Calculate another file
            </ApplyButton>
          </CardActions>
        </Card>
      ) : error.length !== 0 || unexpectedError.length !== 0 ? (
        <Card size="large">
          <CardHeader
            title={
              error.length === 0 ? 'Calculating failed!' : 'File upload failed!'
            }
          />
          <CardContent>
            <ProgressBarComponent
              label={error.length === 0 ? unexpectedError : error}
              value={fileProcessingProgress}
              variant="error"
            />
          </CardContent>
          <CardActions>
            <ApplyButton onClick={handleUploadAnother}>Try Again</ApplyButton>
          </CardActions>
        </Card>
      ) : (
        <>
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
          <input
            type="file"
            id="fileInput"
            data-cy="fileInput"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".xls,.xlsm,.xlsx,.xml,.csv"
          />
        </>
      )}
    </>
  );
};

export default UploadBulkFiles;

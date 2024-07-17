import { useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import {
  Alert,
  ButtonGroup,
  Spinner,
} from '@walmart-web/livingdesign-components';
import ElcOutput from '../ElcOutput/ElcOutput';
import { estimationsResponse, cost } from '../utils/reponseData';
import axios from 'axios';
import { filterValues, ItemDetails, Options } from '../utils/formInterface';
import { handleRequestParams } from '../utils/requestData';
import Shipping from './Shipping';
import CostBases from './CostBases';
import { getEnv, getHeaders } from '../utils/EnvConfig';
import { config } from '../utils/config';
import { ResetButton, SubmitButton } from './CustomButtons';
import { v4 as uuidv4 } from 'uuid';
import {
  INITIAL_VALUES,
  ITEM_DETAILS,
  detailedCostMX,
  detailedCostUS,
  itemNotFound,
  unexpectedError,
} from '../utils/constants';
import DcTransportation from './DcTransportation';
import { flattenPayload } from '../utils/flattenPayload';
import { convertToTitleCase } from '../assets';
import { getSubObject } from '../utils/getSubObject';
import { getEnvironmentInfo } from '../environments/auth.service';
import {
  CCMConfig,
  ICCMConfig,
  Startup,
  WmtAxiosWrapper,
} from '@gs-mso/startup';
import React from 'react';

interface FilterParams {
  market_id: string | number;
  category_id: string | number;
  department_id?: string | number;
  request_type: number;
}

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

export default function CostCalculator() {
  const environment = getEnvironmentInfo();
  const [clicked, setClicked] = useState(true);
  const [userInfo, setUserInfo] = React.useState<IUmsUserInfoDTO | null>(null);
  const [, setCCMValues] = React.useState<MfeConfigType>();
  const [responseOutput, setResponseOutput] = useState<Array<cost>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Options[]>([]);
  const [initialValues, setInitialValues] = useState<{
    market: Options;
    supplier: Options;
    department: Options;
    costValue: string;
    itemId: string;
  }>(INITIAL_VALUES);
  const [filter, setFilter] = useState<{ [key: string]: any }>({});
  const [selectFilter, setSelectFilter] = useState({});
  const [errorResponse, setErrorResponse] = useState('');
  const [errors, setErrors] = useState({});
  const [costBaseFilters, setCostBaseFilters] = useState<Array<filterValues>>(
    []
  );
  const [shippingFilters, setShippingFilters] = useState<Array<filterValues>>(
    []
  );
  const [collectFilters, setCollectFilters] = useState<Array<filterValues>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [estimationApi, setEstimationApi] = useState(
    `${environment.gstCostApiBaseUrl}/costs/estimations`
  );
  const [mandatoryFieldList, setMandatoryFieldList] = useState<string[]>([]);
  const [requestData, setRequestData] = useState({});
  const [itemDetails, setItemDetails] = useState<ItemDetails>();
  const [itemRetrieved, setItemRetrieved] = useState(false);
  let env: { headers: any };
  const [isDuty, setIsDuty] = useState<boolean>(false);

  useEffect(() => {
    env = getEnv(config);
  });

  useEffect(() => {
    if (Number(initialValues.supplier.value) >= 7) {
      setEstimationApi(
        `${environment.gstCostApiBaseUrl}/costs/food/domestic/walmart/estimations`
      );
    }
  }, [initialValues.supplier]);

  React.useEffect(() => {
    const ccmConfigObject: ICCMConfig = {
      applicationBaseUrlKey: 'costFiltersURL',
      ccmBasePaths: {
        devUrl: 'https://gst-cost-ui-nx.dev.walmart.com/etc/config/',
        stgUrl: 'https://gst-cost-ui-nx.stg.walmart.com/etc/config/',
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

  useEffect(() => {
    if (Object.values(errors).some((value) => value !== null)) {
      setClicked(false);
    } else {
      setClicked(true);
    }
  }, [errors]);

  function handleMandatoryFields(filters: Array<filterValues>) {
    const newMandatoryFieldList: string[] | ((prevState: never[]) => never[]) =
      [];
    filters.forEach((item: filterValues) => {
      if (item.mandatory === true) {
        newMandatoryFieldList.push(item.label);
        if (newMandatoryFieldList.indexOf('volume') !== -1) {
          newMandatoryFieldList.splice(
            newMandatoryFieldList.indexOf('volume'),
            1,
            'length',
            'width',
            'height'
          );
        }
      }
    });
    setMandatoryFieldList(newMandatoryFieldList);
  }

  async function fetchDepartment() {
    const headers = getHeaders(env);
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${environment.gstCostApiBaseUrl}/filters`,
        {
          params: {
            market_id: initialValues.market.value,
            category_id: initialValues.supplier.value,
            request_type: 1,
          },
          headers: headers,
        }
      );
      setDepartmentOptions(data.data[0].options);
      setLoading(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorResponse(error.response?.data?.error?.error_message);
        setLoading(false);
      } else {
        console.log(error);
        setErrorResponse(unexpectedError);
        setLoading(false);
      }
    }
  }

  async function fetchItemDetails(itemId: any) {
    const headers = getHeaders(env);
    setLoading(true);
    try {
      const { data, status } = await axios.get<ItemDetails>(
        `${environment.gstCostApiBaseUrl}/item/itemId/${itemId}`,
        {
          headers: headers,
        }
      );
      if (status === 200) {
        setItemRetrieved(true);
        setErrorResponse('');
        setItemDetails(data);
        fetchDepartment();
        setInitialValues((prev) => {
          const department = {
            label: departmentOptions.filter(
              (dept) => Number(dept.value) == data?.deptNo
            )[0]?.label,
            value: data?.deptNo ? String(data?.deptNo) : '',
          };
          return {
            ...prev,
            department: department,
          };
        });
        setFilter((prev) => {
          return {
            ...getSubObject(prev, ['is_domestic', 'market_id']),
            ['department_id']: data?.deptNo,
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            ['Department Id']: `${
              departmentOptions.filter(
                (dept) => Number(dept.value) == data?.deptNo
              )[0]?.label
            }`,
          };
        });
        setLoading(false);
        if (data.itemDuty !== undefined) {
          setIsDuty(data.itemDuty.dutyPct !== 0);
        } else {
          setIsDuty(false);
        }
      } else if (status === 204) {
        setItemRetrieved(false);
        setErrorResponse(itemNotFound);
        setLoading(false);
        setTimeout(() => {
          setErrorResponse('');
        }, 5000);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        //to be modified later
        setErrorResponse(unexpectedError);
        setLoading(false);
      } else {
        console.log(error);
        setErrorResponse(unexpectedError);
        setLoading(false);
      }
    }
  }

  async function fetchFilters() {
    const headers = getHeaders(env);
    setLoading(true);

    try {
      const marketId = initialValues.market.value ?? 0;
      const categoryId = initialValues.supplier.value ?? 0;
      const departmentId = initialValues.department.value ?? 0;

      const params: FilterParams = {
        market_id: marketId,
        category_id: categoryId,
        department_id: departmentId,
        request_type: 2,
      };
      if (+categoryId >= 7) {
        delete params.department_id;
      }
      const { data } = await axios.get(
        `${environment.gstCostApiBaseUrl}/filters`,
        {
          params: params,
          headers: headers,
        }
      );
      displayAccordion(data.data);
      setLoading(false);
      handleMandatoryFields(data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorResponse(error.response?.data?.error?.error_message);
        setLoading(false);
      } else {
        console.log(error);
        setErrorResponse(unexpectedError);
        setLoading(false);
      }
    }
  }

  async function estimations(request: any) {
    setLoading(true);
    try {
      const loginId = userInfo?.loginId;
      const userId = loginId?.split('\\')[1];
      const uuid = uuidv4();
      const source = {
        source_id: userId || null,
        source_name: 'gst-costManagement-ui',
        source_trace_id: uuid,
      };
      const { data } = await axios.post<estimationsResponse>(
        estimationApi,
        { ...request, source },
        {
          headers: getHeaders(env),
        }
      );
      const costs =
        Number(initialValues.supplier.value) >= 7
          ? data.data.costs_by_currency?.[0]?.costs_by_dc?.[0]?.costs ?? []
          : data.data.costs ?? [];

      setResponseOutput(costs);
      setErrorResponse('');
      setClicked(true);
      setLoading(false);
    } catch (error) {
      console.log(error);
      if (axios.isAxiosError(error)) {
        setErrorResponse(error.response?.data?.error?.error_message);
        setLoading(false);
      } else {
        console.log(error);
        setErrorResponse(unexpectedError);
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    resetFilters();
    setDepartmentOptions([]);
    setErrorResponse('');
    setErrors({});
    if (initialValues.market.value && initialValues.supplier.value) {
      if (+initialValues.supplier.value <= 2) {
        setInitialValues((prev) => {
          const department = { label: null, value: null };
          return {
            ...prev,
            department: department,
          };
        });
        setSelectFilter({});
        fetchDepartment();
      } else {
        fetchFilters();
      }
    }
  }, [initialValues.market.value, initialValues.supplier.value]);

  useEffect(() => {
    if (initialValues.department.value && itemDetails) {
      if (Number(initialValues.department.value) !== itemDetails?.deptNo) {
        setInitialValues((prev) => {
          return {
            ...prev,
            itemId: '',
          };
        });
        setItemDetails(ITEM_DETAILS);
        setItemRetrieved(false);
        fetchFilters();
      } else {
        fetchFilters();
      }
    } else if (initialValues.department.value) {
      fetchFilters();
    }
  }, [initialValues.department.value]);

  const handleMandatory = (payload: any) => {
    const newPayload = flattenPayload(payload);

    if (initialValues.costValue !== 'Detailed Cost') {
      if (initialValues.market.value == '1001') {
        const mandatoryFieldListNew = mandatoryFieldList.filter(function (
          item
        ) {
          return !detailedCostUS.includes(item);
        });
        const missingValues = mandatoryFieldListNew.filter(
          (val) => !(val in newPayload)
        );
        if (missingValues.length > 0) return missingValues;
      } else {
        const mandatoryFieldListNew = mandatoryFieldList.filter(function (
          item
        ) {
          return !detailedCostMX.includes(item);
        });
        const missingValues = mandatoryFieldListNew.filter(
          (val) => !(val in newPayload)
        );
        if (missingValues.length > 0) return missingValues;
      }
    } else {
      const missingValues = mandatoryFieldList.filter(
        (val) => !(val in newPayload)
      );
      return missingValues;
    }
  };

  const handleClick = (event: { preventDefault: () => void }) => {
    console.log(filter);
    event.preventDefault();
    const mandatoryFields = handleMandatory(filter);
    if (
      Object.keys(filter).length === 0 ||
      (mandatoryFields && mandatoryFields.length > 0)
    ) {
      const titleCase =
        mandatoryFields && mandatoryFields.length > 0
          ? convertToTitleCase(mandatoryFields[0])
          : 'Unknown';
      setErrorResponse(`Please fill the required field for ${titleCase}.`);
    } else {
      setErrorResponse('');
      const apiRequestData = handleRequestParams(
        filter,
        initialValues.supplier.value ?? ''
      );
      if (initialValues.itemId) {
        apiRequestData.product = {
          ...apiRequestData.product,
          itemId: initialValues.itemId,
        };
      }
      console.log('API Request Data:', apiRequestData);
      estimations(apiRequestData);
    }
  };

  const resetFilters = () => {
    setSelectFilter({});
    setCostBaseFilters([]);
    setShippingFilters([]);
  };

  const handleReset = () => {
    setInitialValues(INITIAL_VALUES);
    setFilter({});
    setErrorResponse('');
    setErrors({});
    setResponseOutput([]);
    resetFilters();
    setItemDetails(ITEM_DETAILS);
    setItemRetrieved(false);
  };

  const handleSelectChange = (option: Options, name: string) => {
    setSelectFilter((prev) => ({
      ...prev,
      [name]: option,
    }));
    setRequestData((prev) => {
      return { ...prev, [convertToTitleCase(name)]: option.label };
    });
  };

  const handleDefaultItem = (name: string) => {
    switch (name) {
      case 'firstCost':
        setFilter((prev) => {
          return {
            ...prev,
            product: {
              ...prev['product'],
              first_cost: itemDetails?.unitCostAmt
                ? itemDetails?.unitCostAmt
                : '',
            },
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'First Cost': itemDetails?.unitCostAmt
              ? itemDetails?.unitCostAmt
              : '',
          };
        });
        break;

      case 'retailCost':
        setFilter((prev) => {
          return {
            ...prev,
            product: {
              ...prev['product'],
              retail_cost: itemDetails?.baseRetailAmt
                ? itemDetails?.baseRetailAmt
                : '',
            },
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Retail Cost': itemDetails?.baseRetailAmt
              ? itemDetails?.baseRetailAmt
              : '',
          };
        });
        break;

      case 'packVolume':
        setFilter((prev) => {
          return {
            ...prev,
            length: itemDetails?.packDimensions?.packLength
              ? itemDetails?.packDimensions?.packLength
              : '',
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Vendor Pack Length': itemDetails?.packDimensions?.packLength
              ? itemDetails?.packDimensions?.packLength
              : '',
          };
        });
        setFilter((prev) => {
          return {
            ...prev,
            width: itemDetails?.packDimensions?.packWidth
              ? itemDetails?.packDimensions?.packWidth
              : '',
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Vendor Pack Width': itemDetails?.packDimensions?.packWidth
              ? itemDetails?.packDimensions?.packWidth
              : '',
          };
        });
        setFilter((prev) => {
          return {
            ...prev,
            height: itemDetails?.packDimensions?.packHeight
              ? itemDetails?.packDimensions?.packHeight
              : '',
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Vendor Pack Height': itemDetails?.packDimensions?.packHeight
              ? itemDetails?.packDimensions?.packHeight
              : '',
          };
        });
        break;

      case 'packWeight':
        setFilter((prev) => {
          return {
            ...prev,
            pack: {
              ...prev['pack'],
              weight: itemDetails?.packDimensions?.packWeight
                ? itemDetails?.packDimensions?.packWeight
                : '',
            },
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Vendor Pack Weight': itemDetails?.packDimensions?.packWeight
              ? itemDetails?.packDimensions?.packWeight
              : '',
          };
        });
        break;

      case 'packTotalEaches':
        setFilter((prev) => {
          return {
            ...prev,
            pack: {
              ...prev['pack'],
              total_eaches: itemDetails?.orderablePackQty
                ? itemDetails?.orderablePackQty
                : '',
            },
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Vendor Pack Total Eaches': itemDetails?.orderablePackQty
              ? itemDetails?.orderablePackQty
              : '',
          };
        });
        break;

      case 'packVolumeUom':
        setFilter((prev) => {
          return {
            ...prev,
            pack: {
              ...prev['pack'],
              volume_uom: itemDetails?.packDimensions?.packUomCode
                ? itemDetails?.packDimensions?.packUomCode === 'IN'
                  ? 'CI'
                  : 'CR'
                : '',
            },
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Vendor Pack Volume Unit Of Measure': itemDetails?.packDimensions
              ?.packUomCode
              ? itemDetails?.packDimensions?.packUomCode
              : '',
          };
        });
        break;

      case 'packWeightUom':
        setFilter((prev) => {
          return {
            ...prev,
            pack: {
              ...prev['pack'],
              weight_uom: itemDetails?.packDimensions?.packWeightUOM
                ? itemDetails?.packDimensions?.packWeightUOM
                : '',
            },
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Vendor Pack Weight Unit Of Measure': itemDetails?.packDimensions
              ?.packWeightUOM
              ? itemDetails?.packDimensions?.packWeightUOM
              : '',
          };
        });
        break;

      case 'dutyRate':
        setFilter((prev) => {
          return {
            ...prev,
            product: {
              ...prev['product'],
              duty_rate: itemDetails?.itemDuty?.dutyPct
                ? itemDetails?.itemDuty?.dutyPct
                : '',
            },
          };
        });
        setRequestData((prev) => {
          return {
            ...prev,
            'Duty(%)': itemDetails?.itemDuty?.dutyPct
              ? itemDetails?.itemDuty?.dutyPct
              : '',
          };
        });
        break;
    }
  };

  function setDefaultValue(filter: filterValues) {
    let defaultFilter: Array<Options>;
    let added = false;
    if (filter.defaultValue) {
      if (
        itemDetails &&
        Number(initialValues.department.value) === itemDetails?.deptNo
      ) {
        if (filter.name === 'packVolumeUom' || filter.name === 'packWeightUom')
          handleDefaultItem(filter.name);
        else {
          if (filter.inputType === 'input') {
            added = true;
          } else if (filter.options) {
            defaultFilter = filter.options.filter(
              (e) => e.value === filter.defaultValue
            );
            if (defaultFilter.length > 0) {
              added = true;
              if (filter.inputType === 'select') {
                handleSelectChange(defaultFilter[0], filter.label);
              }
            }
          }
          if (added) {
            setFilter((prev) => {
              if (filter.division) {
                return {
                  ...prev,
                  [filter.division]: {
                    ...prev[filter.division],
                    [filter.label]: filter.defaultValue,
                  },
                };
              } else {
                return {
                  ...prev,
                  [filter.label]: filter.defaultValue,
                };
              }
            });
            if (filter.inputType !== 'select')
              setRequestData((prev) => {
                return { ...prev, [filter.displayLabel]: filter.defaultValue };
              });
          }
        }
      } else {
        if (filter.inputType === 'input') {
          added = true;
        } else if (filter.options) {
          defaultFilter = filter.options.filter(
            (e) => e.value === filter.defaultValue
          );
          if (defaultFilter.length > 0) {
            added = true;
            if (filter.inputType === 'select') {
              handleSelectChange(defaultFilter[0], filter.label);
            }
          }
        }
        if (added) {
          setFilter((prev) => {
            if (filter.division) {
              return {
                ...prev,
                [filter.division]: {
                  ...prev[filter.division],
                  [filter.label]: filter.defaultValue,
                },
              };
            } else {
              return {
                ...prev,
                [filter.label]: filter.defaultValue,
              };
            }
          });
          if (filter.inputType !== 'select')
            setRequestData((prev) => {
              return { ...prev, [filter.displayLabel]: filter.defaultValue };
            });
        }
      }
    } else if (
      itemDetails &&
      Number(initialValues.department.value) == itemDetails?.deptNo
    ) {
      handleDefaultItem(filter.name);
    }
  }

  const displayAccordion = (filters: Array<filterValues>) => {
    if (filters.length > 0) {
      const costBase: Array<filterValues> = [];
      const shipping: Array<filterValues> = [];
      const shippoint: Array<filterValues> = [];
      filters.forEach((filter) => {
        setDefaultValue(filter);
        if (Number(filter.group) === 1) {
          costBase.push(filter);
        } else if (Number(filter.group) === 2) {
          if (
            filter.label == 'transport_mode' &&
            initialValues.market.value == '1001'
          ) {
            if (filter.options) {
              const filteredOptions = filter.options.filter((mode) => {
                return (
                  mode.label &&
                  (mode.label.includes('OCEAN') || mode.label.includes('OCN'))
                );
              });
              filter.options = filteredOptions;
            }
          }
          shipping.push(filter);
        } else if (filter.group == 3 || filter.group == 3.1) {
          shippoint.push(filter);
        }
      });
      setCostBaseFilters(costBase);
      setShippingFilters(shipping);
      setCollectFilters(shippoint);
    } else {
      console.log('No filters');
    }
  };

  useEffect(() => {
    console.log(costBaseFilters);
  }, [costBaseFilters]);

  const handleInputChange = (
    e: { preventDefault: () => void; target: { value: string } },
    name: any,
    division: string,
    numRegex: string | RegExp,
    errorMsg: any,
    mandatory: boolean,
    label: any
  ) => {
    e.preventDefault();
    const isValid = validateInput(e.target.value, numRegex, mandatory);

    setFilter((prev) => {
      if (division?.includes('.')) {
        const div = division.split('.')[0]; //array
        const subDivision = division.split('.')[1]; //key
        return {
          ...prev,
          [div]: {
            ...prev[div],
            [subDivision]: {
              ...prev[div]?.[subDivision],
              [name]: e.target.value,
            },
          },
        };
      } else if (division) {
        return {
          ...prev,
          [division]: {
            ...prev[division],
            [name]: e.target.value,
          },
        };
      } else {
        return {
          ...prev,
          [name]: e.target.value,
        };
      }
    });

    setRequestData((prev) => {
      return { ...prev, [label]: e.target.value };
    });

    if (!isValid) {
      if (e.target.value === '') {
        setErrors((prev) => {
          return { ...prev, [name]: '*This is a mandatory field' };
        });
      } else {
        setErrors((prev) => {
          return { ...prev, [name]: `*${errorMsg}` };
        });
      }
    } else {
      setErrors((prev) => {
        return { ...prev, [name]: null };
      });
    }
  };

  const validateInput = (
    value: string,
    numRegex: string | RegExp,
    mandatory: boolean
  ) => {
    if (value !== '') {
      const regex = new RegExp(numRegex);
      return regex.test(value);
    } else if (value === '' && mandatory === true) {
      return false;
    } else {
      return true;
    }
  };

  return loading ? (
    <>
      <div
        style={{
          opacity: '0.7',
          position: 'fixed',
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          height: '100%',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: '999',
          pointerEvents: 'none',
        }}
      >
        <Spinner color="white" size="large" />
      </div>
      {errorResponse && (
        <>
          <Alert
            variant="error"
            UNSAFE_style={{ marginTop: '7%', marginBottom: '-7%' }}
            data-cy="mandatoryError"
          >
            {errorResponse}
          </Alert>
          <br />
        </>
      )}
      {itemRetrieved && (
        <>
          <Alert
            variant="success"
            UNSAFE_style={{ marginTop: '7%', marginBottom: '-9%' }}
            data-cy="IQSsucess"
          >
            Depending on the selected item,the following fields have been
            automatically filled.You have the option to override them if needed.
          </Alert>
          {isDuty && (
            <Alert
              variant="warning"
              UNSAFE_style={{ marginTop: '10%', marginBottom: '-10%' }}
              data-cy="DutySucess"
            >
              Duty is only directional using an average duty rate for this type
              of product and subject to Supplier complying with all Partner
              Government Agency (FDA, EPA, CPSC etc.) regulatory requirements.
            </Alert>
          )}
        </>
      )}
      <Grid container spacing={4}>
        <Grid item lg={6} style={{ marginTop: '105px' }}>
          <CostBases
            costBaseFilters={costBaseFilters}
            initialValues={initialValues}
            setInitialValues={setInitialValues}
            setFilter={setFilter}
            filter={filter}
            departmentOptions={departmentOptions}
            fetchItemDetails={fetchItemDetails}
            errors={errors}
            setErrors={setErrors}
            selectFilter={selectFilter}
            handleSelectChange={handleSelectChange}
            handleInputChange={handleInputChange}
            setRequestData={setRequestData}
          />
          <br />
          {shippingFilters && shippingFilters.length > 0 && (
            <Shipping
              filter={filter}
              handleInputChange={handleInputChange}
              errors={errors}
              setFilter={setFilter}
              selectFilter={selectFilter}
              handleSelectChange={handleSelectChange}
              shippingFilters={shippingFilters}
              initialValues={initialValues}
              setInitialValues={setInitialValues}
              setRequestData={setRequestData}
              setErrors={setErrors}
            />
          )}
          <br />
          {collectFilters && collectFilters.length > 0 && (
            <DcTransportation
              filter={filter}
              handleInputChange={handleInputChange}
              errors={errors}
              setFilter={setFilter}
              collectFilters={collectFilters}
              setRequestData={setRequestData}
            />
          )}
          <br />
          <div className="button" style={{ float: 'right' }}>
            <ButtonGroup>
              <ResetButton data-cy="reset" onClick={handleReset} size="medium">
                <u>Reset</u>
              </ResetButton>
              {clicked === true ? (
                <SubmitButton
                  data-cy="submit"
                  color="primary"
                  size="medium"
                  onClick={handleClick}
                  variant="contained"
                >
                  Submit
                </SubmitButton>
              ) : (
                <SubmitButton
                  data-cy="submit"
                  size="medium"
                  disabled
                  variant="contained"
                >
                  Submit
                </SubmitButton>
              )}
            </ButtonGroup>
          </div>
        </Grid>
        <Grid
          item
          lg={6}
          style={{
            marginTop: '105px',
          }}
        >
          <ElcOutput
            itemDetails={itemDetails}
            error={errorResponse}
            responseData={responseOutput}
            requestData={filter}
          ></ElcOutput>
        </Grid>
      </Grid>
    </>
  ) : (
    <>
      {errorResponse && (
        <Alert
          variant="error"
          UNSAFE_style={{ marginTop: '5%', marginBottom: '-7%' }}
          data-cy="mandatoryError"
        >
          {errorResponse}
        </Alert>
      )}
      {itemRetrieved && (
        <>
          <Alert
            variant="success"
            UNSAFE_style={{ marginTop: '7%', marginBottom: '-9%' }}
            data-cy="IQSsucess"
          >
            Depending on the selected item,the following fields have been
            automatically filled.You have the option to override them if needed.
          </Alert>
          {isDuty && (
            <Alert
              variant="warning"
              UNSAFE_style={{ marginTop: '10%', marginBottom: '-10%' }}
              data-cy="DutySucess"
            >
              Duty is only directional using an average duty rate for this type
              of product and subject to Supplier complying with all Partner
              Government Agency (FDA, EPA, CPSC etc.) regulatory requirements.
            </Alert>
          )}
        </>
      )}
      <Grid container spacing={4}>
        <Grid item lg={6} style={{ marginTop: '105px' }}>
          <CostBases
            costBaseFilters={costBaseFilters}
            initialValues={initialValues}
            setInitialValues={setInitialValues}
            setFilter={setFilter}
            filter={filter}
            departmentOptions={departmentOptions}
            fetchItemDetails={fetchItemDetails}
            errors={errors}
            setErrors={setErrors}
            selectFilter={selectFilter}
            handleSelectChange={handleSelectChange}
            handleInputChange={handleInputChange}
            setRequestData={setRequestData}
          />
          <br />
          {shippingFilters && shippingFilters.length > 0 && (
            <Shipping
              filter={filter}
              initialValues={initialValues}
              setInitialValues={setInitialValues}
              handleInputChange={handleInputChange}
              errors={errors}
              setFilter={setFilter}
              selectFilter={selectFilter}
              handleSelectChange={handleSelectChange}
              shippingFilters={shippingFilters}
              setRequestData={setRequestData}
              setErrors={setErrors}
            />
          )}
          <br />
          {collectFilters && collectFilters.length > 0 && (
            <DcTransportation
              filter={filter}
              handleInputChange={handleInputChange}
              errors={errors}
              setFilter={setFilter}
              collectFilters={collectFilters}
              setRequestData={setRequestData}
            />
          )}
          <div className="button" style={{ float: 'right' }}>
            <ButtonGroup>
              <ResetButton data-cy="reset" onClick={handleReset} size="medium">
                <u>Reset</u>
              </ResetButton>
              {clicked === true ? (
                <SubmitButton
                  data-cy="submit"
                  color="primary"
                  size="medium"
                  onClick={handleClick}
                  variant="contained"
                >
                  Submit
                </SubmitButton>
              ) : (
                <SubmitButton
                  data-cy="submit"
                  size="medium"
                  disabled
                  variant="contained"
                >
                  Submit
                </SubmitButton>
              )}
            </ButtonGroup>
          </div>
        </Grid>
        <Grid
          item
          lg={6}
          style={{
            marginTop: '105px',
          }}
        >
          <ElcOutput
            itemDetails={itemDetails}
            error={errorResponse}
            responseData={responseOutput}
            requestData={requestData}
          ></ElcOutput>
        </Grid>
      </Grid>
    </>
  );
}

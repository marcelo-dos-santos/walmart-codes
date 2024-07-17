import React, { useState, useEffect } from 'react';
import {
  Divider,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import {
  CustomAccordion,
  CustomAccordionSummary,
  validateInput,
} from '../assets';
import { ExpandMore } from '@mui/icons-material';
import InputText from '../utils/InputText';
import { Options, filterValues } from '../utils/formInterface';
import CostFilterFormTitle, {
  RadioButtonStyle,
  RadioButtonStyleBold,
} from './CostFilterFormTitle';
import {
  colorRed,
  errorMsgdimension,
  testInputDimension,
} from '../utils/constants';
import RadioInput from '../utils/RadioInput';
import SelectInput from '../utils/SelectInput';
// import styles from "./Shipping.module.css";

interface ShippingProps {
  shippingFilters: Array<filterValues>;
  filter: any;
  handleInputChange: any;
  errors: any;
  setFilter: any;
  selectFilter: any;
  handleSelectChange: any;
  initialValues: {
    market: Options;
    supplier: Options;
    department: Options;
    costValue: string;
  };
  setInitialValues: any;
  setRequestData: any;
  setErrors: any;
}

const Shipping: React.FC<ShippingProps> = ({
  shippingFilters,
  initialValues,
  setInitialValues,
  filter,
  handleInputChange,
  errors,
  setFilter,
  selectFilter,
  handleSelectChange,
  setRequestData,
  setErrors,
}: ShippingProps) => {
  const [customizedCost, setCustomizedCost] = useState<boolean>(false);
  const [, setSelectedTransportMode] = useState(
    filter?.import_freight?.transport_mode
  );
  const value = filter.overrides?.cost_overrides?.freight_amount
    ? filter.overrides?.cost_overrides?.freight_amount
    : '';

  const alwasyDisabled = true;

  useEffect(() => {
    const minimumCBM = 58;
    let maximumKg = 19500;

    const length = filter?.length;
    const width = filter?.width;
    const height = filter?.height;
    const volumeUom = filter.pack?.volume_uom;
    const weightUom = filter.pack?.weight_uom;
    const packWeight = filter.pack?.weight;

    let actualCBM = 0;
    let grossKgPerCarton = 0;

    if (length && width && height) {
      actualCBM = parseFloat(length) * parseFloat(width) * parseFloat(height);
      if (volumeUom === 'IN') {
        actualCBM = (actualCBM / 1728) * 0.0283168;
      }

      if (packWeight) {
        grossKgPerCarton = parseFloat(packWeight);
        if (weightUom === 'LB') {
          grossKgPerCarton /= 2.20462;
        }
      }

      if (weightUom === 'LB') {
        maximumKg *= 2.20462;
      }

      const heavyweightCheck = (minimumCBM / actualCBM) * grossKgPerCarton;

      if (heavyweightCheck > maximumKg) {
        const newTransportMode = 5;
        setSelectedTransportMode(newTransportMode);
        handleSelectChange(
          {
            value: newTransportMode,
            label: '5 - OCN HEAVY',
          },
          'transport_mode'
        );
        setFilter((prev: { import_freight: any }) => ({
          ...prev,
          import_freight: {
            ...prev.import_freight,
            transport_mode: newTransportMode,
          },
        }));
      } else {
        const newTransportMode = 1;
        setSelectedTransportMode(newTransportMode);
        handleSelectChange(
          {
            value: newTransportMode,
            label: '1 - OCEAN',
          },
          'transport_mode'
        );
        setFilter((prev: { import_freight: any }) => ({
          ...prev,
          import_freight: {
            ...prev.import_freight,
            transport_mode: newTransportMode,
          },
        }));
      }
    }
  }, [filter.length, filter.width, filter.height, filter.pack, setFilter]);

  useEffect(() => {
    const networkType = filter?.network_id;
    let newTransportModeValue = filter?.import_freight?.transport_mode;

    if (networkType == 2 || networkType == 3) {
      newTransportModeValue = 1;
      handleSelectChange(
        {
          value: newTransportModeValue,
          label: '1 - OCEAN',
        },
        'transport_mode'
      );
      setSelectedTransportMode(newTransportModeValue);
    } else {
      newTransportModeValue = 6;
      handleSelectChange(
        {
          value: newTransportModeValue,
          label: '6 - OCN REFER',
        },
        'transport_mode'
      );
      setSelectedTransportMode(newTransportModeValue);
    }
  }, [filter.network_id]);

  const handleWeightChange = (e: { target: { value: string } }) => {
    const packWeight = e.target.value;
    const weightUom = filter.pack?.weight_uom;
    const networkType = filter?.network_id;
    let newTransportModeValue = filter?.import_freight?.transport_mode;
    const mandatory = true;
    const numRegex = '^[+]?(?=.*[1-9])\\d*(?:\\.\\d*)?$';
    const errorMsg = 'Value should be greater than zero';

    const weightLimit = weightUom === 'LB' ? 42990 : 19500;

    const isValid = validateInput(e.target.value, numRegex, mandatory);

    if (!isValid) {
      if (e.target.value === '') {
        setErrors((prev: any) => {
          return { ...prev, ['weight']: '*This is a mandatory field' };
        });
      } else {
        setErrors((prev: any) => {
          return { ...prev, ['weight']: `*${errorMsg}` };
        });
      }
    } else {
      setErrors((prev: any) => {
        return { ...prev, ['weight']: null };
      });
    }

    if (
      (networkType == 2 || networkType == 3) &&
      Number(packWeight) > weightLimit
    ) {
      newTransportModeValue = 5;
      handleSelectChange(
        {
          value: newTransportModeValue,
          label: '5 - OCN HEAVY',
        },
        'transport_mode'
      );
      setSelectedTransportMode(newTransportModeValue);
    } else {
      newTransportModeValue = 1;
      handleSelectChange(
        {
          value: newTransportModeValue,
          label: '1 - OCEAN',
        },
        'transport_mode'
      );
      setSelectedTransportMode(newTransportModeValue);
    }

    setFilter((currentFilter: { pack: any; import_freight: any }) => ({
      ...currentFilter,
      pack: {
        ...currentFilter.pack,
        weight: packWeight,
      },
      import_freight: {
        ...currentFilter.import_freight,
        transport_mode: newTransportModeValue,
      },
    }));
  };

  useEffect(() => {
    if (initialValues.costValue === 'Customized Cost') {
      setCustomizedCost(true);
    } else {
      setCustomizedCost(false);
      setFilter((prev: any) => {
        return {
          ...prev,
          overrides: {
            cost_overrides: {
              freight_amount: '',
            },
          },
        };
      });
    }
  }, [initialValues.costValue]);

  return (
    <CustomAccordion defaultExpanded={true}>
      <CustomAccordionSummary expandIcon={<ExpandMore />}>
        <CostFilterFormTitle as="h3" size="medium" weight={700}>
          Shipping and Transportation
        </CostFilterFormTitle>
      </CustomAccordionSummary>
      <AccordionDetails>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div
            style={{
              flexDirection: 'column',
              width: '100%',
              marginBottom: '5px',
            }}
          >
            <RadioGroup
              value={initialValues.costValue}
              onChange={(e) => {
                setInitialValues((prev: any) => {
                  return {
                    ...prev,
                    costValue: e.target.value,
                  };
                });
              }}
            >
              <FormControlLabel
                data-cy="customizedCost"
                value="Customized Cost"
                control={<Radio />}
                label={
                  customizedCost !== false ? (
                    <RadioButtonStyleBold>Customized Cost</RadioButtonStyleBold>
                  ) : (
                    <RadioButtonStyle>Customized Cost</RadioButtonStyle>
                  )
                }
              />
              {customizedCost === true ? (
                <div
                  style={{
                    flexDirection: 'column',
                    width: '100%',
                    marginTop: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '12px',
                      display: 'block',
                      margin: '0px 0px 4px 8px',
                    }}
                  >
                    <CostFilterFormTitle as="h4" size="small" weight={400}>
                      Enter transportation and Shipping Cost($)
                      <span style={{ color: colorRed }}>*</span>
                    </CostFilterFormTitle>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '231px',
                      height: '34px',
                      border: '1px solid #909196',
                      borderRadius: '4px',
                      fontFamily: 'Bogle',
                      fontStyle: 'normal',
                      fontWeight: '400',
                      fontSize: '14px',
                      color: '#74767C',
                      paddingLeft: '12px',
                      marginLeft: '9px',
                    }}
                    required
                    value={value || ''}
                    onChange={(e) => {
                      setFilter(
                        (prev: { [x: string]: { [x: string]: any } }) => {
                          return {
                            ...prev,
                            ['overrides']: {
                              ...prev['overrides'],
                              ['cost_overrides']: {
                                ...prev['overrides']?.['cost_overrides'],
                                freight_amount: e.target.value,
                              },
                            },
                          };
                        }
                      );
                    }}
                    placeholder="$"
                    data-cy="freight_amount"
                  ></input>
                  {Object.prototype.hasOwnProperty.call(
                    errors,
                    'freight_amount'
                  ) ? (
                    <p style={{ color: colorRed }}>
                      {errors['freight_amount']}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div
                  style={{
                    flexDirection: 'column',
                    width: '100%',
                    marginTop: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '12px',
                      display: 'block',
                      color: 'rgba(116, 118, 124, 1)',
                      margin: '0px 0px 4px 8px',
                    }}
                  >
                    <CostFilterFormTitle as="h4" size="small" weight={400}>
                      Enter transportation and Shipping Cost($)
                    </CostFilterFormTitle>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '231px',
                      height: '34px',
                      border: '1px solid #909196',
                      borderRadius: '4px',
                      fontFamily: 'Bogle',
                      fontWeight: '400',
                      fontSize: '14px',
                      color: '#74767C',
                      paddingLeft: '12px',
                      marginLeft: '9px',
                    }}
                    disabled
                    placeholder="$"
                    data-cy="disabled-customizedCost"
                  ></input>
                </div>
              )}
              <Divider>Or</Divider>
              <FormControlLabel
                data-cy="detailedCost"
                value="Detailed Cost"
                control={<Radio />}
                label={
                  customizedCost === false ? (
                    <RadioButtonStyleBold>
                      Shipping Details
                    </RadioButtonStyleBold>
                  ) : (
                    <RadioButtonStyle>Shipping Details</RadioButtonStyle>
                  )
                }
              />
            </RadioGroup>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {shippingFilters.map((val, index) => {
              switch (val.inputType) {
                case 'radio':
                  return (
                    <RadioInput
                      key={index}
                      isDisabled={customizedCost}
                      val={val}
                      filter={filter}
                      setFilter={setFilter}
                      errors={errors}
                      setRequestData={setRequestData}
                    />
                  );
                case 'select':
                  return (
                    <SelectInput
                      key={index}
                      isDisabled={
                        val.label === 'transport_mode'
                          ? alwasyDisabled
                          : customizedCost
                      }
                      val={val}
                      selectFilter={selectFilter}
                      handleSelectChange={handleSelectChange}
                      errors={errors}
                      setFilter={setFilter}
                      setRequestData={setRequestData}
                    />
                  );
                case 'input':
                  if (val.label === 'volume') {
                    return (
                      <div style={{ display: 'flex' }} key={index}>
                        <InputText
                          isDisabled={customizedCost}
                          label="Length"
                          name="length"
                          width="150px"
                          widthInput="141px"
                          filter={filter}
                          mandatory={true}
                          regex={testInputDimension}
                          errorMsg={errorMsgdimension}
                          handleInputChange={handleInputChange}
                          errors={errors}
                          data-cy="length"
                          setRequestData={setRequestData}
                        />
                        <InputText
                          isDisabled={customizedCost}
                          label="Width"
                          name="width"
                          width="150px"
                          widthInput="141px"
                          filter={filter}
                          mandatory={true}
                          regex={testInputDimension}
                          errorMsg={errorMsgdimension}
                          handleInputChange={handleInputChange}
                          errors={errors}
                          data-cy="width"
                          setRequestData={setRequestData}
                        />
                        <InputText
                          isDisabled={customizedCost}
                          label="Height"
                          name="height"
                          width="150px"
                          widthInput="141px"
                          filter={filter}
                          mandatory={true}
                          regex={testInputDimension}
                          errorMsg={errorMsgdimension}
                          handleInputChange={handleInputChange}
                          errors={errors}
                          data-cy="height"
                          setRequestData={setRequestData}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <InputText
                        isDisabled={customizedCost}
                        key={index}
                        label={val.displayLabel}
                        name={val.label}
                        filter={filter}
                        mandatory={val.mandatory}
                        regex={val.regExp}
                        errorMsg={val.errorMsg}
                        onBlurCallback={
                          val.name === 'packWeight' ? handleWeightChange : null
                        }
                        handleInputChange={handleInputChange}
                        division={val.division}
                        errors={errors}
                        data-cy={val.displayLabel}
                        setRequestData={setRequestData}
                      />
                    );
                  }
                default:
                  return null;
              }
            })}
          </div>
        </div>
      </AccordionDetails>
    </CustomAccordion>
  );
};

export default Shipping;

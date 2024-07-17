import React from 'react';
import { AccordionDetails, Checkbox, FormControlLabel } from '@mui/material';
import { CustomAccordion, CustomAccordionSummary } from '../assets';
import { ExpandMore } from '@mui/icons-material';
import InputText from '../utils/InputText';
import { Options, filterValues } from '../utils/formInterface';
import CostFilterFormTitle from './CostFilterFormTitle';
import { testInputDimension, errorMsgdimension } from '../utils/constants';
import RadioInput from '../utils/RadioInput';
import SelectInput from '../utils/SelectInput';
import Supplier from '../utils/Supplier';
import Market from '../utils/Market';
import Department from '../utils/Department';
import ItemID from '../utils/ItemID';

export interface CostBasesProps {
  costBaseFilters: Array<filterValues>;
  departmentOptions: Options[];
  fetchItemDetails: any;
  initialValues: {
    market: Options;
    supplier: Options;
    department: Options;
    costValue: string;
  };
  setInitialValues: any;
  filter: any;
  handleInputChange: any;
  errors: any;
  setFilter: any;
  selectFilter: any;
  handleSelectChange: any;
  setRequestData: any;
  setErrors: any;
}

const CostBases: React.FC<CostBasesProps> = ({
  costBaseFilters,
  initialValues,
  setInitialValues,
  setFilter,
  filter,
  departmentOptions,
  errors,
  setErrors,
  selectFilter,
  handleSelectChange,
  handleInputChange,
  setRequestData,
  fetchItemDetails,
}: CostBasesProps) => {
  return (
    <CustomAccordion defaultExpanded>
      <CustomAccordionSummary expandIcon={<ExpandMore />}>
        <CostFilterFormTitle as="h3" size="medium" weight={700}>
          Cost Bases
        </CostFilterFormTitle>
      </CustomAccordionSummary>
      <AccordionDetails>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* supplier */}
          <Supplier
            initialValues={initialValues}
            setInitialValues={setInitialValues}
            setFilter={setFilter}
            setRequestData={setRequestData}
          />
          {/* market */}
          <Market
            initialValues={initialValues}
            setInitialValues={setInitialValues}
            setRequestData={setRequestData}
            setFilter={setFilter}
          />
          <ItemID
            initialValues={initialValues}
            setInitialValues={setInitialValues}
            setRequestData={setRequestData}
            fetchItemDetails={fetchItemDetails}
            errors={errors}
            setErrors={setErrors}
          />
          {/* department */}
          <Department
            initialValues={initialValues}
            setInitialValues={setInitialValues}
            setFilter={setFilter}
            setRequestData={setRequestData}
            departmentOptions={departmentOptions}
          />
        </div>
        {costBaseFilters.length !== 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {costBaseFilters.map((val, index) => {
              switch (val.inputType) {
                case 'radio':
                  return (
                    <RadioInput
                      key={index}
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
                      val={val}
                      selectFilter={selectFilter}
                      handleSelectChange={handleSelectChange}
                      errors={errors}
                      setRequestData={setRequestData}
                      setFilter={setFilter}
                    />
                  );
                case 'input':
                  //send val only refactor
                  if (val.label === 'volume') {
                    return (
                      <div style={{ display: 'flex' }} key={index}>
                        <InputText
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
                        key={index}
                        label={val.displayLabel}
                        name={val.label}
                        mandatory={val.mandatory}
                        filter={filter}
                        division={val.division}
                        handleInputChange={handleInputChange}
                        errors={errors}
                        data-cy={val.label}
                        regex={val.regExp}
                        errorMsg={val.errorMsg}
                        setRequestData={setRequestData}
                      />
                    );
                  }
                case 'checkbox':
                  return (
                    <div
                      style={{
                        flexDirection: 'column',
                        width: '100%',
                        marginBottom: '5px',
                        marginLeft: '10px',
                      }}
                      key={index}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            inputProps={
                              {
                                'data-cy': val.name,
                              } as React.InputHTMLAttributes<HTMLInputElement>
                            }
                            checked={
                              filter[val.label] ? filter[val.label] : false
                            }
                            onChange={(e) => {
                              setFilter((prev: any) => {
                                return {
                                  ...prev,
                                  [val.label]: e.target.checked,
                                };
                              });
                              setRequestData((prev: any) => {
                                return {
                                  ...prev,
                                  [val.displayLabel]: e.target.checked,
                                };
                              });
                            }}
                          />
                        }
                        label={val.displayLabel}
                      />
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>
        ) : null}
      </AccordionDetails>
    </CustomAccordion>
  );
};

export default CostBases;

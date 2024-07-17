import React from 'react';
import { AccordionDetails } from '@mui/material';
import { CustomAccordion, CustomAccordionSummary } from '../assets';
import { ExpandMore } from '@mui/icons-material';
import InputText from '../utils/InputText';
import { filterValues } from '../utils/formInterface';
import CostFilterFormTitle from './CostFilterFormTitle';

interface CollectProps {
  collectFilters: Array<filterValues>;
  filter: any;
  handleInputChange: any;
  errors: any;
  setFilter: any;
  setRequestData: any;
}

const DcTransportation: React.FC<CollectProps> = ({
  collectFilters,
  filter,
  errors,
  handleInputChange,
  setRequestData,
}: CollectProps) => {
  const sortedCollect = collectFilters.filter(function (a) {
    return a.group == 3;
  });
  const itemDcCollect = collectFilters.filter(function (a) {
    return a.group == 3.1;
  });

  return (
    <CustomAccordion defaultExpanded={true}>
      <CustomAccordionSummary expandIcon={<ExpandMore />}>
        <CostFilterFormTitle as="h3" size="medium" weight={700}>
          DC Transportation
        </CostFilterFormTitle>
      </CustomAccordionSummary>
      <AccordionDetails>
        {sortedCollect.length !== 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {sortedCollect.map((val, index) => {
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
            })}
          </div>
        ) : null}
        <CustomAccordion defaultExpanded={true}>
          <CustomAccordionSummary expandIcon={<ExpandMore />}>
            <CostFilterFormTitle as="h4" size="small" weight={400}>
              Item To DC Transportation
            </CostFilterFormTitle>
          </CustomAccordionSummary>
          <AccordionDetails>
            {itemDcCollect.length !== 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {itemDcCollect.map((val, index) => {
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
                })}
              </div>
            ) : null}
          </AccordionDetails>
        </CustomAccordion>
      </AccordionDetails>
    </CustomAccordion>
  );
};

export default DcTransportation;

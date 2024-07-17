import React from 'react';
import { Container, Divider, Tabs, Tab, Button } from '@mui/material';
import { Body, Heading } from '@walmart-web/livingdesign-components';
import CostFactors from './CostFactors/CostFactors';
import BulkUpload from './BulkUpload/BulkUpload';
import CostCalculatorMultiple from './CostCalculatorMultiple/CostCalculatorMultiple';
import CostCalculator from './CostCalculator/CostCalculator';
import { getEnv } from './utils/EnvConfig';
import { config } from './utils/config';

const App = () => {
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  const [value, setValue] = React.useState(0);

  const env: { headers: any } = getEnv(config);
  const rateMaintenanceEnable =
    env.headers['WM_SVC.ENV'] === 'prod' ? false : true;
  const bulkUploadEnable = env.headers['WM_SVC.ENV'] === 'prod' ? false : true;
  const costCalculatorMultiple =
    env.headers['WM_SVC.ENV'] === 'prod' ? false : true;
  const costCalculator = env.headers['WM_SVC.ENV'] === 'prod' ? false : true;

  const handleFeedback = () => {
    const feedbackBaseUrl = window.location.host.includes('stg.walmart.com')
      ? 'https://feedbackally.walmart.com/survey/87syg3HhKvG7ajm/'
      : 'https://feedbackally.walmart.com/survey/Jqg4LqYSh5R8ynF/';

    window.open(feedbackBaseUrl, '_blank');
  };

  const TabPanel = (props: TabPanelProps) => {
    const { children, value, index } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
      >
        {value === index && <Container maxWidth="lg">{children}</Container>}
      </div>
    );
  };

  function htmlElementProps(index: number) {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`,
    };
  }

  const handleChange = (e: React.SyntheticEvent, val: number) => {
    setValue(val);
  };

  return (
    <Container
      sx={{ marginLeft: '25px', width: 'calc(100vw - -65px)' }}
      maxWidth={false}
      classes={{ root: 'app' }}
    >
      <div
        style={{
          width: '99.5%',
          zIndex: '1000',
          position: 'relative',
          backgroundColor: '#fff',
          marginLeft: 'calc(8vw - 65px)',
          top: '60px',
        }}
      >
        <Container
          sx={{
            margin: '15px 2px 30px -25px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: 'none !important',
            width: 'calc(100vw - 65px)',
          }}
        >
          <Heading
            as="h1"
            size="medium"
            weight={700}
            UNSAFE_style={{ paddingTop: '5px', width: 'calc(5vw - 65px)' }}
          >
            Costing
          </Heading>
          <div style={{ marginRight: '110px' }}>
            <Button
              variant="contained"
              onClick={handleFeedback}
              sx={{
                marginTop: '0px',
                height: '40px',
                borderRadius: '20px',
                backgroundColor: 'rgb(25, 118, 210)',
                color: '#ffffff',
                padding: '0 30px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#1972d2',
                },
                boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
              }}
            >
              Feedback
            </Button>
          </div>
        </Container>
        <Divider></Divider>
        <Container sx={{ margin: '15px 2px 0px 0px' }}>
          <Tabs value={value} onChange={handleChange}>
            {costCalculator && (
              <Tab
                label={
                  <Body as="p" size="medium" weight={400}>
                    Cost Calculator
                  </Body>
                }
                {...htmlElementProps(0)}
              ></Tab>
            )}
            {costCalculatorMultiple && (
              <Tab
                label={
                  <Body as="p" size="medium" weight={400}>
                    Cost Calculator(Multiple)
                  </Body>
                }
                {...htmlElementProps(1)}
              ></Tab>
            )}
            {rateMaintenanceEnable && (
              <Tab
                label={
                  <Body as="p" size="medium" weight={400}>
                    Rate Maintenance
                  </Body>
                }
                {...htmlElementProps(2)}
              ></Tab>
            )}
            {bulkUploadEnable && (
              <Tab
                label={
                  <Body as="p" size="medium" weight={400}>
                    Bulk Upload
                  </Body>
                }
                {...htmlElementProps(3)}
              ></Tab>
            )}
          </Tabs>
        </Container>
      </div>
      <TabPanel data-cy="costClaculatorMultiple" value={value} index={0}>
        <CostCalculator></CostCalculator>
      </TabPanel>
      <TabPanel data-cy="costClaculatorMultiple" value={value} index={1}>
        <CostCalculatorMultiple></CostCalculatorMultiple>
      </TabPanel>
      <TabPanel data-cy="rateMaintenance" value={value} index={2}>
        <CostFactors></CostFactors>{' '}
      </TabPanel>
      <TabPanel data-cy="bulkUpload" value={value} index={3}>
        <BulkUpload></BulkUpload>
      </TabPanel>
    </Container>
  );
};

export default App;

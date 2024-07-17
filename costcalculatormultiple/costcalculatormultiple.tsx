import React from 'react';
import DownloadTemplate from './DownloadTemplate';
import { Grid } from '@mui/material';
import UploadBulkFiles from './UploadBulkFiles';

const CostClaculatorMultiple = () => {
  const [supplier, setSupplier] = React.useState('2');
  const [market, setMarket] = React.useState('1001');
  return (
    <div style={{ position: 'relative', zIndex: '1', marginTop: '7%' }}>
      <Grid
        direction="column"
        justifyContent="space-evenly"
        alignItems="stretch"
      >
        <DownloadTemplate
          supplier={supplier}
          setSupplier={setSupplier}
          market={market}
          setMarket={setMarket}
        />
        <UploadBulkFiles supplier={supplier} market={market} />
      </Grid>
    </div>
  );
};

export default CostClaculatorMultiple;

import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableIcon from './TableIcon';
import { RateHistoryModal } from './ViewHistory';
import { RatesTableProps } from '../utils/formInterface';
import styles from '../utils/CostFactorsStyles';
import { EditButton } from './CustomApplyButton';
import { useState, useEffect } from 'react';
import EditRateModal from './EditRateModal';

interface RateData {
  rateValue: number;
  effectiveDate: string;
  expirationDate: string;
  currency: string;
  rateType: string;
  rateBasis: string;
}

function createData(
  effectiveDate: string,
  expirationDate: string,
  currency: string,
  rateType: string,
  rateBasis: string
) {
  return { effectiveDate, expirationDate, currency, rateType, rateBasis };
}

const rows = [
  createData('1/5/2023', '1/21/2023', 'US Dollar', 'Amount', 'Cubic Meter'),
];

export default function RatesTable({
  isSecondTable,
  isFuture,
  rateValue,
  effectiveDate,
  expirationDate,
  currency,
  rateType,
  rateBasis,
  ratesData,
  selectedValues,
  onEditRateSuccess,
  onDeleteRate,
  filterData,
}: RatesTableProps) {
  const [tableData, setTableData] = useState(rows);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRate, setSelectedRate] = useState({
    rateValue: 0,
    effectiveDate: '',
    expirationDate: '',
    currency: '',
    rateType: '',
    rateBasis: '',
  });

  function handleEditSuccess(newRate: RateData) {
    setTableData((prevData) => {
      return prevData.map((row) =>
        row.effectiveDate === newRate.effectiveDate ? newRate : row
      );
    });

    if (onEditRateSuccess) {
      onEditRateSuccess([newRate]);
    }
  }

  const handleEditClick = () => {
    setSelectedRate({
      rateValue,
      effectiveDate,
      expirationDate,
      currency,
      rateType,
      rateBasis,
    });
    setShowEditModal(true);
  };

  function isFutureDate(dateString: string): boolean {
    const todayUtc = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    );
    const rateEffectiveDateUtc = Date.UTC(
      new Date(dateString).getUTCFullYear(),
      new Date(dateString).getUTCMonth(),
      new Date(dateString).getUTCDate()
    );

    return rateEffectiveDateUtc > todayUtc;
  }

  console.log('Rates Data RatesTable:', ratesData);

  const isFutureRate = isFutureDate(effectiveDate);

  useEffect(() => {
    const uniqueRates = ratesData.reduce((acc, current) => {
      const x = acc.find(
        (item: { effective_date: any; rate_value: any }) =>
          item.effective_date === current.effective_date &&
          item.rate_value === current.rate_value
      );
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    setTableData(uniqueRates);
  }, [ratesData]);

  useEffect(() => {
    setTableData([
      createData(effectiveDate, expirationDate, currency, rateType, rateBasis),
    ]);
  }, [effectiveDate, expirationDate, currency, rateType, rateBasis, ratesData]);

  return (
    <>
      <TableContainer
        component={Paper}
        style={{
          ...styles.tableContainer,
          borderTop: isSecondTable
            ? '1px solid rgba(227, 228, 229, 1)'
            : 'none',
        }}
      >
        <Table aria-label="simple table" style={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell style={styles.rateValueCell}>
                {rateType === 'Amount' ? `$${rateValue}` : `${rateValue}%`}
              </TableCell>
              <TableCell style={{ width: '20%', textAlign: 'right' }}>
                <span style={{ ...styles.cellStyle }}>
                  <TableIcon
                    isFuture={isFuture}
                    effectiveDate={effectiveDate}
                    expirationDate={expirationDate}
                  />
                </span>
              </TableCell>
              <TableCell style={{ width: '70%', textAlign: 'right' }}>
                <span style={{ ...styles.cellHistoryStyle }}>
                  {!isSecondTable && (
                    <>
                      <svg
                        width="16"
                        height="17"
                        viewBox="0 0 16 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={styles.svgStyle}
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M8.73815 2.05005C12.1965 2.05005 15 4.84827 15 8.30005C15 11.7518 12.1965 14.55 8.73815 14.55C6.86482 14.55 5.12538 13.7234 3.94313 12.3199C3.7657 12.1092 3.79294 11.7949 4.00399 11.6178C4.21503 11.4407 4.52995 11.4679 4.70739 11.6785C5.70189 12.8592 7.16279 13.5535 8.73815 13.5535C11.645 13.5535 14.0015 11.2014 14.0015 8.30005C14.0015 5.39867 11.645 3.04663 8.73815 3.04663C5.83126 3.04663 3.47476 5.39867 3.47476 8.30005C3.47476 8.31515 3.47409 8.33009 3.47277 8.34484L4.14163 7.67719L4.21078 7.61953C4.40535 7.48499 4.67436 7.50421 4.84766 7.67719C5.04262 7.87178 5.04262 8.18728 4.84766 8.38188L3.34995 9.87675L3.28081 9.9344C3.08624 10.0689 2.81723 10.0497 2.64393 9.87675L1.14622 8.38188L1.08846 8.31286C0.953666 8.11866 0.972922 7.85016 1.14622 7.67719L1.21536 7.61953C1.40993 7.48499 1.67895 7.50421 1.85225 7.67719L2.47629 8.30011C2.47629 4.84833 5.27982 2.05005 8.73815 2.05005ZM2.97553 8.79834C2.99067 8.79834 3.00565 8.79767 3.02045 8.79635L2.99694 8.81982L2.97553 8.79834Z"
                          fill="black"
                        />
                        <path
                          d="M7.74759 5.7404C7.78986 5.50795 7.99369 5.33168 8.23878 5.33168L8.32852 5.33971C8.56141 5.3819 8.73801 5.58535 8.73801 5.82997V8.48198L10.9204 9.35364L11.0007 9.39436C11.2012 9.51986 11.2895 9.77423 11.1985 10.0014C11.0961 10.2569 10.8055 10.3811 10.5495 10.2789L8.05337 9.28236L7.9763 9.2436C7.83085 9.15392 7.73954 8.99436 7.73954 8.81971V5.82997L7.74759 5.7404Z"
                          fill="black"
                        />
                      </svg>
                      <span style={styles.viewHistoryStyle}>
                        <a
                          href="#"
                          style={styles.linkStyle}
                          onClick={() => {
                            setShowHistoryModal(true);
                            setSelectedRate({
                              rateValue,
                              effectiveDate,
                              expirationDate,
                              currency,
                              rateType,
                              rateBasis,
                            });
                          }}
                        >
                          View history
                        </a>
                      </span>
                    </>
                  )}
                  {isFuture && (
                    <EditButton
                      label="Edit"
                      style={styles.editButtonStyle}
                      onClick={handleEditClick}
                    />
                  )}
                </span>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <TableContainer
        component={Paper}
        style={{ boxShadow: 'none', border: 'none' }}
      >
        <Table
          sx={{ minWidth: 650 }}
          aria-label="simple table"
          style={{ boxShadow: 'none', border: 'none' }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                style={{ ...styles.headerCell, textAlign: 'left' }}
                align="center"
                color="rgba(116, 118, 124, 1)"
              >
                Effective Date
              </TableCell>
              <TableCell
                style={{
                  ...styles.headerCell,
                  textAlign: 'left',
                }}
                align="center"
                color="rgba(116, 118, 124, 1)"
              >
                Termination Date
              </TableCell>
              <TableCell
                style={{
                  ...styles.headerCell,
                  textAlign: 'left',
                }}
                align="center"
                color="rgba(116, 118, 124, 1)"
              >
                Currency
              </TableCell>
              <TableCell
                style={{
                  ...styles.headerCell,
                  textAlign: 'left',
                }}
                align="center"
                color="rgba(116, 118, 124, 1)"
              >
                Rate Type
              </TableCell>
              <TableCell
                style={{
                  ...styles.headerCell,
                  textAlign: 'left',
                }}
                align="center"
                color="rgba(116, 118, 124, 1)"
              >
                Unit of Measure
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row) => (
              <TableRow
                key={row.effectiveDate}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell align="left">{row.effectiveDate}</TableCell>
                <TableCell align="left">{row.expirationDate}</TableCell>
                <TableCell align="left">{row.currency}</TableCell>
                <TableCell align="left">{row.rateType}</TableCell>
                <TableCell align="left">{row.rateBasis}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <RateHistoryModal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        ratesData={ratesData}
        filterData={filterData}
        selectedValues={selectedValues}
        selectedRate={selectedRate}
      />
      {selectedRate && (
        <EditRateModal
          isAdminMode={false}
          onAddRateClick={function (rateData: {
            rateValue: number;
            effectiveDate: string;
            expirationDate: string;
            currency: string;
            rateType: string;
            rateBasis: string;
          }): void {
            throw new Error('Function not implemented.');
          }}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          ratesData={ratesData}
          selectedValues={selectedValues}
          onEditRateSuccess={handleEditSuccess}
          onDeleteRate={onDeleteRate}
          isFuture={isFutureRate}
          {...selectedRate}
        />
      )}
    </>
  );
}

import React from 'react';
import {
  Body,
  Container,
  Heading,
  Select,
  Button,
} from '@walmart-web/livingdesign-components';
import { styled, Grid } from '@mui/material';
import {
  MXDirectImportRequest,
  USDirectImportRequest,
  headers_MX,
  headers_US,
} from '../assets/DirectImportsRequest';
import { config } from '../utils/config';
import { getEnv, getHeaders } from '../utils/EnvConfig';
import axios from 'axios';
import { Options, filterValues } from '../utils/formInterface';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { getEnvironmentInfo } from '../environments/auth.service';

const DownloadContainer = styled(Container)({
  width: '1136px',
  height: '342px',
  backgroundColor: 'rgba(255, 255, 255, 1)',
  boxShadow:
    '0px 1px 2px 1px rgba(0, 0, 0, 0.15), 0px -1px 2px 0px rgba(0, 0, 0, 0.1)',
  border: '1px solid lightGrey',
  borderRadius: '8px',
  padding: '10px',
});

interface filterOptions {
  agent_office_id: Array<string>;
  incoterm_code: Array<string>;
  network_id?: Array<string>;
  loading_port_id: Array<string>;
  is_flow?: Array<string>;
  supplier_9dvn?: Array<string>;
  transport_mode?: Array<string>;
  volume_uom: Array<string>;
  weight_uom: Array<string>;
  tax_category_id?: Array<string>;
  origin_country_code?: Array<string>;
  import_country_code?: Array<string>;
  container_type_id?: Array<string>;
  destination_port_id?: Array<string>;
  entry_port_id?: Array<string>;
}

export interface DownloadTemplateProps {
  supplier: string;
  setSupplier: any;
  market: string;
  setMarket: any;
}

const DownloadTemplate: React.FC<DownloadTemplateProps> = ({
  supplier,
  setSupplier,
  market,
  setMarket,
}) => {
  const [department, setDepartment] = React.useState('92');
  const [departmentOptions, setDepartmentOptions] = React.useState<Options[]>(
    []
  );
  const [filterOptions, setFilterOptions] = React.useState<filterOptions>();
  const [isDisabled, setIsDisabled] = React.useState(true);
  let env: { headers: any };

  React.useEffect(() => {
    env = getEnv(config);
  });

  const environment = getEnvironmentInfo();

  React.useEffect(() => {
    fetchDepartment();
    fetchFilters();
  }, [market, department]);

  function getData() {
    let requestData;

    if (supplier === '2' && market === '1001') {
      requestData = [...USDirectImportRequest];
    } else {
      requestData = [...MXDirectImportRequest];
    }

    return requestData;
  }

  const columnToLetter = (column: number) => {
    let temp;
    let letter = '';
    let col = column + 1;
    while (col > 0) {
      temp = (col - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      col = (col - temp - 1) / 26;
    }
    return letter;
  };

  const addDropdown = (
    worksheet: ExcelJS.Worksheet,
    optionWorksheet: any,
    headerKey: string,
    options: any
  ) => {
    const dropdownColumn = worksheet.getColumn(headerKey);
    const dropdownColLetter = columnToLetter(dropdownColumn.number - 1);

    const optionsColumn = optionWorksheet.getColumn(
      optionWorksheet.columns.length + 1
    );
    optionsColumn.values = [headerKey, ...options];
    // optionsColumn.hidden = true;
    optionWorksheet.state = 'hidden';

    const optionsRange = `$${optionsColumn.letter}$2:$${optionsColumn.letter}$${
      options?.length + 1
    }`;

    for (let i = 4; i < 1000; i++) {
      worksheet.getCell(`${dropdownColLetter}${i}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`Sheet2!${optionsRange}`],
      };
    }
  };

  async function fetchDepartment() {
    const headers = getHeaders(env);
    try {
      const { data } = await axios.get(
        `${environment.gstCostApiBaseUrl}/filters`,
        {
          params: {
            market_id: market,
            category_id: supplier,
            request_type: 1,
          },
          headers: headers,
        }
      );
      setDepartmentOptions(data.data[0].options);
      setIsDisabled(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error);
      } else {
        console.log(error);
      }
    }
  }

  async function fetchFilters() {
    const headers = getHeaders(env);

    try {
      const params = {
        market_id: market,
        category_id: supplier,
        department_id: department,
        request_type: 2,
      };
      const { data } = await axios.get(
        `${environment.gstCostApiBaseUrl}/filters`,
        {
          params: params,
          headers: headers,
        }
      );

      data.data.forEach((item: filterValues) => {
        let optionArray: (string | null | undefined)[] = [];
        if (item.inputType == 'select' || item.inputType == 'radio') {
          if (item.label == 'transport_mode' && market == '1001') {
            const filteredOptions = item.options?.filter((mode) => {
              if (mode.label?.includes('OCEAN') || mode.label?.includes('OCN'))
                return mode;
            });
            item.options = filteredOptions;
          }
          if (item.options) {
            optionArray = item.options.map((option) => option.label);
          } else {
            console.log(`No options available for ${item.label}`);
          }
          setFilterOptions((prev) => {
            const safePrev: filterOptions = prev || {
              agent_office_id: [],
              incoterm_code: [],
              loading_port_id: [],
              volume_uom: [],
              weight_uom: [],
              network_id: [],
            };
            const updatedOptions: filterOptions = {
              ...safePrev,
              [item.label]: optionArray.filter(
                (label): label is string =>
                  label !== null && label !== undefined
              ),
            };

            return updatedOptions;
          });
        }
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error);
      } else {
        console.log(error);
      }
    }
  }

  const DownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    const optionWorksheet = workbook.addWorksheet('Sheet2');
    optionWorksheet.columns = [{ header: 'Sample', key: 'sample', width: 10 }];
    let columns: any = [];

    if (market == '1001') {
      columns = headers_US.map((header) => ({
        header: header.label,
        key: header.key,
        width: 27,
      }));
    } else if (market == '1003') {
      columns = headers_MX.map((header) => ({
        header: header.label,
        key: header.key,
        width: 27,
      }));
    }

    worksheet.columns = columns;

    if (market == '1003') {
      worksheet.getColumn(25).width = 26;
      worksheet.getCell('Y1').value = 'Landed Cost';
    } else if (market == '1001') {
      worksheet.getColumn(22).width = 26;
      worksheet.getCell('V1').value = 'Landed Cost';
    }

    worksheet.spliceRows(1, 0, []);
    worksheet.spliceRows(1, 0, []);

    const mergeRangeCustomHeader = market === '1001' ? `A1:V2` : `A1:Y2`;
    worksheet.mergeCells(mergeRangeCustomHeader);

    const mergedHeaderCell = worksheet.getCell('A1');
    mergedHeaderCell.value =
      'INPUT FIELD. All marked in asterisks (*) are mandatory';
    mergedHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF' },
    };
    mergedHeaderCell.font = {
      color: { argb: 'FF0000' },
      size: 22,
    };
    mergedHeaderCell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };

    worksheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 0 }];

    const headerRow = worksheet.getRow(3);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0070C0' },
      };
      cell.font = {
        color: { argb: 'FFFFFF' },
        bold: true,
        size: 16,
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
    });

    for (let i = 3; i <= worksheet.rowCount; i++) {
      const cell =
        market === '1001'
          ? worksheet.getCell(`V${i}`)
          : worksheet.getCell(`Y${i}`);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '00B050' },
      };
    }

    const data = getData();
    console.log('Data', data);
    data.forEach((item) => {
      const rowData = columns.reduce((obj: any, column: { key: string }) => {
        const keyPath = column.key.split('.');
        const value = keyPath.reduce(
          (currentValue: any, key: string | number) => {
            return currentValue ? (currentValue as any)[key] : null;
          },
          item
        );
        (obj as any)[column.key] = value;
        return obj;
      }, {});

      console.log('Row data to be added:', rowData);
      worksheet.addRow(rowData);
    });

    if (market === '1001') {
      addDropdown(
        worksheet,
        optionWorksheet,
        'department_id',
        departmentOptions.map((options) => options.label)
      );
      addDropdown(worksheet, optionWorksheet, 'market_id', [
        '1001-WAL-MART INC.USA',
        '1003-CMA MEXICO-WBSV',
      ]);
      addDropdown(
        worksheet,
        optionWorksheet,
        'network_id',
        filterOptions?.network_id
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'is_flow',
        filterOptions?.is_flow
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'agent_office_id',
        filterOptions?.agent_office_id
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'supplier.supplier_9dvn',
        filterOptions?.supplier_9dvn
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'pack.volume_uom',
        filterOptions?.volume_uom
      );
      addDropdown(worksheet, optionWorksheet, 'pack.weight_uom', ['KG', 'LB']);
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.incoterm_code',
        filterOptions?.incoterm_code
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.transport_mode',
        filterOptions?.transport_mode
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.loading_port_id',
        filterOptions?.loading_port_id
      );
    } else if (market === '1003') {
      addDropdown(
        worksheet,
        optionWorksheet,
        'department_id',
        departmentOptions.map((options) => options.label)
      );
      addDropdown(worksheet, optionWorksheet, 'market_id', [
        '1001-WAL-MART INC.USA',
        '1003-CMA MEXICO-WBSV',
      ]);
      addDropdown(
        worksheet,
        optionWorksheet,
        'agent_office_id',
        filterOptions?.agent_office_id
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'pack.volume_uom',
        filterOptions?.volume_uom
      );
      addDropdown(worksheet, optionWorksheet, 'pack.weight_uom', ['KG', 'LB']);
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.incoterm_code',
        filterOptions?.incoterm_code
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'product.tax_category_id',
        filterOptions?.tax_category_id
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.container_type_id',
        filterOptions?.container_type_id
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.entry_port_id',
        filterOptions?.entry_port_id
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.origin_country_code',
        filterOptions?.origin_country_code
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.import_country_code',
        filterOptions?.import_country_code
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.transport_mode',
        filterOptions?.transport_mode
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.loading_port_id',
        filterOptions?.loading_port_id
      );
      addDropdown(
        worksheet,
        optionWorksheet,
        'import_freight.destination_port_id',
        filterOptions?.destination_port_id
      );
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(
      blob,
      `${market === '1001' ? 'USDirectImports.xlsx' : 'MXDirectImports.xlsx'}`
    );
  };

  return (
    <DownloadContainer>
      <div style={{ height: '76px', padding: '10px' }}>
        <Heading as="h2" size="medium" weight={700}>
          Estimate multiple DC landed costs
        </Heading>
      </div>
      <div style={{ padding: '0 0 10px 10px' }}>
        <Body size="small" weight={700} as="div">
          Steps of multiple costing calculation:
        </Body>
      </div>
      <div style={{ margin: '3px 3px 5px 0px', paddingLeft: '13px' }}>
        <Body
          size="small"
          weight={400}
          as="div"
          UNSAFE_style={{ paddingBottom: '10px' }}
        >
          1. Begin by selecting the Supplier type, Purchase company, and
          Department number. Then, download the provided template.
        </Body>
        <Body
          size="small"
          weight={400}
          as="div"
          UNSAFE_style={{ paddingBottom: '10px' }}
        >
          2. Utilize our template to import the line items required for the
          costing calculation (max 1000 items/file).
        </Body>
        <Body
          size="small"
          weight={400}
          as="div"
          UNSAFE_style={{ paddingBottom: '10px' }}
        >
          3. Upload the completed costing file below, and our system will
          initiate the calculation automatically. Avoid refreshing the page
          during this process.
        </Body>
        <Body
          size="small"
          weight={400}
          as="div"
          UNSAFE_style={{ paddingBottom: '10px' }}
        >
          4. After the calculation is finished, the resulting costing file will
          be available for download.
        </Body>
      </div>
      <Grid
        container
        spacing={4}
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        style={{
          marginTop: '15px',
          paddingLeft: '44px',
          width: '1070px',
          flexFlow: 'row',
        }}
      >
        <Select
          label="Supplier type"
          onChange={(event) => setSupplier(event.target.value)}
          size="small"
          value={supplier}
          UNSAFE_style={{ marginRight: '15px' }}
        >
          <option value="0">Select</option>
          <option value="2">Direct Imports</option>
        </Select>
        <Select
          label="Purchase company"
          onChange={(event) => setMarket(event.target.value)}
          size="small"
          value={market}
          UNSAFE_style={{ marginRight: '15px' }}
        >
          <option value="0">Select</option>
          <option value="1001">1001 - WAL-MART INC. USA</option>
          <option value="1003">1003 - CMA MEXICO - WBSV</option>
        </Select>
        <Select
          label="Department number"
          onChange={(event) => {
            setDepartment(event.target.value);
          }}
          size="small"
          value={department}
          UNSAFE_style={{ marginRight: '15px' }}
        >
          <option value="0">Select</option>
          {departmentOptions.map((dept, index) => {
            return (
              <option value={dept.value ?? ''} key={index}>
                {dept.label}
              </option>
            );
          })}
        </Select>
        <Button
          variant="primary"
          size="medium"
          onClick={DownloadTemplate}
          UNSAFE_style={{ marginTop: '22px', color: 'white' }}
          disabled={isDisabled}
        >
          Download Template
        </Button>
      </Grid>
    </DownloadContainer>
  );
};

export default DownloadTemplate;

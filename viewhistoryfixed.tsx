import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { renderLineChart } from "./ViewHistoryGraph";
import { useEffect, useState } from "react";
import { Options } from "../../utils/formInterface";
import * as XLSX from "xlsx";
import { CSSProperties } from "react";

interface RateHistoryModalProps {
  open: boolean;
  onClose: () => void;
  ratesData: any[];
  selectedRate: {
    rateValue: number;
    effectiveDate: string;
    expirationDate: string;
    currency: string;
    rateType: string;
    rateBasis: string;
  };
  filterData: {
    links: Array<{
      link_name: string;
      data: Array<{
        value: number | string;
        label: string;
      }>;
    }>;
  };
  selectedValues: {
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
  };
}

const buttonGroupStyle = {
  backgroundColor: "rgba(227, 228, 229, 1)",
  borderRadius: "6px",
  padding: "4px",
  width: "126px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
};

const buttonTextStyle = {
  color: "rgba(46, 47, 50, 1)",
  fontWeight: 400,
  fontFamily: "Bogle",
  fontSize: "14px",
  lineHeight: "20px",
};

const buttonStyle = {
  ...buttonTextStyle,
  width: "56px",
  height: "32px",
  borderRadius: "4px",
  padding: "0 12px",
  textTransform: "none" as const,
  backgroundColor: "rgba(227, 228, 229, 1)",
  border: "none",
};

const activeButtonStyle = {
  ...buttonStyle,
  ...buttonTextStyle,
  backgroundColor: "rgba(255, 255, 255, 1)",
  boxShadow: "0px 1px 2px 1px rgba(0, 0, 0, 0.15), 0px -1px 2px 0px rgba(0, 0, 0, 0.1)",
};

const downloadButtonStyle: CSSProperties = {
  ...buttonTextStyle,
  position: "absolute",
  right: "33px",
  top: "63px",
  backgroundColor: "rgba(227, 228, 229, 1)",
  textTransform: "none" as const,
};

const headerCellStyle = {
  backgroundColor: "rgba(248, 248, 248, 1)",
  fontFamily: "Bogle",
  fontWeight: 700,
  fontSize: "16px",
  lineHeight: "24px",
  color: "rgba(46, 47, 50, 1)",
};

const rowCellStyle = {
  ...headerCellStyle,
  backgroundColor: "none",
  fontWeight: 400,
};

const tableContainerStyle = {
  maxHeight: "350px",
  overflow: "auto",
  marginTop: "16px",
  "&::WebkitScrollbar": {
    width: "6px",
  },
  "&::WebkitScrollbarThumb": {
    backgroundColor: "rgba(158, 158, 158, 1)",
    borderRadius: "3px",
    height: "88px",
  },
};

export const RateHistoryModal: React.FC<RateHistoryModalProps> = ({
  open,
  onClose,
  ratesData,
  selectedRate,
  selectedValues,
  filterData,
}) => {
  const [tableData, setTableData] = useState(ratesData);
  const [selectedButton, setSelectedButton] = useState<"table" | "graph">("table");
  const [purchaseCompanyOptions, setPurchaseCompanyOptions] = useState([]);
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);
  const [expenseParameterOptions, setExpenseParameterOptions] = useState([]);
  const graphData = [];

  const market: { label: string; options: Options[] } = {
    label: "Purchase Company",
    options: [
      { value: "1001", label: "1001 - WAL-MART INC. USA" },
      { value: "1003", label: "1003 - CMA MEXICO - WBSV" },
    ],
  };

  const exportToExcel = () => {
    const findLabelByValue = (linkName, value) => {
      const link = filterData.links.find((link) => link.link_name === linkName);
      if (!link) {
        console.error(`Link not found for ${linkName}`);
        return "Label not found";
      }
      const dataEntry = link.data.find((d) => d.value === value);
      return dataEntry ? dataEntry.label : "Label not found";
    };
    const findLabelInOptions = (value, options) => {
      const foundOption = options.find((option) => option.value === value);
      return foundOption ? foundOption.label : "Label not found";
    };
    const baseFilters = { ...selectedValues };
    Object.keys(baseFilters).forEach((key) => {
      if (baseFilters[key] === "") {
        delete baseFilters[key];
      }
    });
    const renamedRatesData = ratesData.map((entry) => {
      let result = {};
      if (selectedValues.purchaseCompany) {
        result["Purchase Company"] = findLabelInOptions(
          selectedValues.purchaseCompany,
          purchaseCompanyOptions
        );
      }
      if (selectedValues.expenseType) {
        result["Element"] = findLabelInOptions(selectedValues.expenseType, expenseTypeOptions);
      }
      if (selectedValues.expenseParameter) {
        result["Factor"] = findLabelInOptions(
          selectedValues.expenseParameter,
          expenseParameterOptions
        );
      }
      if (selectedValues.loadingPort) {
        result["Loading Port"] = findLabelByValue("port", entry.loading_port_id);
      }
      if (selectedValues.entryPort) {
        result["Entry Port"] = findLabelByValue("port", entry.entry_port_id);
      }
      if (selectedValues.transportMode) {
        result["Transport Mode"] = findLabelByValue("transportMode", entry.transport_mode);
      }
      if (selectedValues.container) {
        result["Container Type"] = findLabelByValue("container", entry.container_type_id);
      }
      if (selectedValues.destinationPort) {
        result["Destination Port"] = findLabelByValue("port", entry.destination_port_id);
      }
      if (selectedValues.agentOffice) {
        result["Agent Office"] = findLabelByValue("agentOffice", entry.agent_office_id);
      }
      if (selectedValues.department) {
        result["Department"] = findLabelByValue("department", entry.department_id);
      }
      if (selectedValues.country) {
        result["Origin Country"] = findLabelByValue("originCountry", entry.origin_country_id);
      }
      if (selectedValues.importCountry) {
        result["Import Country"] = findLabelByValue("importCountry", entry.import_country_id);
      }
      if (selectedValues.taxCategory) {
        result["Tax Category"] = findLabelByValue("taxCategory", entry.tax_category_id);
      }
      result = {
        ...result,
        "Effective Date": entry.effective_date,
        "Termination Date": entry.termination_date,
        "Rate Type": entry.rate_type,
        "Rate Value": entry.rate_value,
        "Currency Code": entry.currency_code || "",
        "Unit of Measure": entry.per_uom_code || "",
        "Update User ID": entry.update_user_id,
        "Create TS": entry.create_ts,
        "Update TS": entry.update_ts,
      };

      return result;
    });

    const ws = XLSX.utils.json_to_sheet(renamedRatesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rate History");

    XLSX.writeFile(wb, "rate_history.xlsx");
  };

  tableData.forEach((rate) => {
    graphData.push({
      effectiveDate: rate.effective_date,
      ratePercent: rate.rate_value,
    });
    graphData.push({
      effectiveDate: rate.termination_date,
      ratePercent: rate.rate_value,
    });
  });

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
    if (dataWithElements && selectedValues.expenseType) {
      const selectedExpense = dataWithElements.elements.find(
        (el) => el.element_id === selectedValues.expenseType
      );
      if (selectedExpense && selectedExpense.factors) {
        const parameters = selectedExpense.factors.map((f) => ({
          value: f.subtype_id,
          label: `${f.subtype_id} - ${f.subtype_name}`,
        }));
        setExpenseParameterOptions(parameters);
      } else {
        setExpenseParameterOptions([]);
      }
    }
  }, [filterData, selectedValues.expenseType]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ style: { width: "1000px", height: "535px" } }}
    >
      <DialogTitle>
        Rate History
        <IconButton
          aria-label="Close"
          data-cy="close-modal-button"
          style={{ position: "absolute", right: "8px", top: "8px" }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <ButtonGroup variant="contained" color="primary" style={buttonGroupStyle}>
          <Button
            style={selectedButton === "table" ? activeButtonStyle : buttonStyle}
            onClick={() => setSelectedButton("table")}
            disabled={selectedButton === "table"}
          >
            Table
          </Button>
          <Button
            style={selectedButton === "graph" ? activeButtonStyle : buttonStyle}
            onClick={() => setSelectedButton("graph")}
            disabled={selectedButton === "graph"}
          >
            Graph
          </Button>
        </ButtonGroup>
        {selectedButton === "table" ? (
          <TableContainer component={Paper} style={tableContainerStyle}>
            <Table aria-label="rate history table">
              <TableHead>
                <TableRow>
                  <TableCell style={headerCellStyle}>Effective Date</TableCell>
                  <TableCell style={headerCellStyle}>Expiration Date</TableCell>
                  <TableCell style={headerCellStyle}>Currency</TableCell>
                  <TableCell style={headerCellStyle}>Rate Type</TableCell>
                  <TableCell style={headerCellStyle}>Rate/Percent</TableCell>
                  <TableCell style={headerCellStyle}>Unit of Measure</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ratesData.map((rate, index) => (
                  <TableRow key={rate.effectiveDate || index}>
                    <TableCell data-testid="effective-date" style={rowCellStyle}>
                      {rate.effective_date}
                    </TableCell>
                    <TableCell style={rowCellStyle}>{rate.termination_date}</TableCell>
                    <TableCell style={rowCellStyle}>{rate.currency_code}</TableCell>
                    <TableCell style={rowCellStyle}>{rate.rate_type}</TableCell>
                    <TableCell style={rowCellStyle}>{rate.rate_value}</TableCell>
                    <TableCell style={rowCellStyle}>{rate.per_uom_code}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          renderLineChart(graphData)
        )}
        <Button
          variant="contained"
          color="primary"
          style={downloadButtonStyle}
          onClick={exportToExcel}
        >
          Download
        </Button>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState, useEffect, useRef } from "react";
import axios, { all } from "axios";
import {
  Grid,
  Divider,
  Container,
  Snackbar,
  LinearProgress,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Options } from "../../utils/formInterface";
import { getEnv, getHeaders } from "../../utils/EnvConfig";
import { config } from "../../utils/config";
import { ApplyButton, UploadButton } from "../CostFactors/CustomApplyButton";
import LoadingRates from "./LoadingRates";
import RatesTable from "./RatesTable";
import AddRateModal from "./AddRateModal";
import UploadRatesModal from "./UploadRatesModal";
import * as XLSX from "xlsx";
import AutocompleteSelect from "./AutocompleteSelect";
import PaginationComponent from "./TablePagination";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

interface FilterData {
  links: Array<{
    link_name: string;
    data: Array<{
      value: number | string;
      label: string;
    }>;
  }>;
}

export default function CostFactors() {
  const [showAddRateModal, setShowAddRateModal] = useState(false);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  let env: {
    [x: string]: string;
    headers: any;
  };
  const [purchaseCompanyOptions, setPurchaseCompanyOptions] = useState([]);
  const [expenseTypeOptions, setExpenseTypeOptions] = useState([]);
  const [expenseParameterOptions, setExpenseParameterOptions] = useState([]);
  const [dropdownConfigs, setDropdownConfigs] = useState<any[]>([]);
  const [linkOptions, setLinkOptions] = useState({});
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(5);
  const [pageRatesData, setPageRatesData] = React.useState(0);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [rowsPerPageRatesData, setRowsPerPageRatesData] = React.useState(5);
  const [gotoPageRatesData, setGotoPageRatesData] = React.useState("");
  const [pageUploadedRates, setPageUploadedRates] = React.useState(0);
  const [rowsPerPageUploadedRates, setRowsPerPageUploadedRates] = React.useState(5);
  const [gotoPageUploadedRates, setGotoPageUploadedRates] = React.useState("");
  const [ratesData, setRatesData] = useState([]);
  const [selectedRateData, setSelectedRateData] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [activeRateData, setActiveRateData] = useState(null);
  const [refreshRates, setRefreshRates] = useState(false);
  const [allRatesData, setAllRatesData] = useState([]);
  const [uploadedRates, setUploadedRates] = useState([]);
  const [progress, setProgress] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedValues, setSelectedValues] = useState({
    purchaseCompany: "",
    expenseType: "",
    expenseParameter: "",
    transportMode: "",
    containerType: "",
    loadingPort: "",
    destinationPort: "",
    entryPort: "",
    supplier9dvn: "",
    agentOffice: "",
    port: "",
    destination: "",
    department: "",
    container: "",
    country: "",
    taxCategory: "",
    importCountry: "",
    originCountry: "",
  });
  const [allSelectsPopulated, setAllSelectsPopulated] = useState<boolean>(false);

  const market: { label: string; options: Options[] } = {
    label: "Purchase Company",
    options: [
      { value: "1001", label: "1001 - WAL-MART INC. USA" },
      { value: "1003", label: "1003 - CMA MEXICO - WBSV" },
    ],
  };

  const filterValues = {
    market_id: selectedValues.purchaseCompany,
    element_id: selectedValues.expenseType,
    element_subtype_id: selectedValues.expenseParameter,
    loading_port_id: selectedValues.loadingPort,
    entry_port_id: selectedValues.entryPort,
    transport_mode: selectedValues.transportMode,
    container_type_id: selectedValues.container,
    destination_port_id: selectedValues.destinationPort,
    supplier9dvn_id: selectedValues.supplier9dvn,
    agent_office_id: selectedValues.agentOffice,
    port_id: selectedValues.port,
    destination_id: selectedValues.destination,
    department_id: selectedValues.department,
    container_id: selectedValues.container,
    country_id: selectedValues.country,
    tax_category_id: selectedValues.taxCategory,
    import_country_id: selectedValues.importCountry,
    origin_country_id: selectedValues.originCountry,
  };

  function isExpiringSoon(expirationDate: string): boolean {
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(today.getMonth() + 1);

    const rateExpirationDate = new Date(expirationDate);
    return rateExpirationDate >= oneMonthLater;
  }

  useEffect(() => {
    env = getEnv(config);
  });

  const StyledContainer = styled(Container)({
    backgroundColor: "rgba(255, 255, 255, 1)",
    boxShadow: "0px 1px 2px 1px rgba(0, 0, 0, 0.15), 0px -1px 2px 0px rgba(0, 0, 0, 0.1)",
    border: "1px solid lightGrey",
    borderRadius: "8px",
    paddingTop: "5px",
    maxWidth: "100%",
  });

  const handleSelectChange = (event, fieldName) => {
    const newValue = event ? event.target.value : "";

    setSelectedValues((prevSelectedValues) => {
      const updatedValues = { ...prevSelectedValues, [fieldName]: newValue };

      if (fieldName === "purchaseCompany") {
        if (newValue) {
          setIsLoadingApi(true);
          updatedValues.expenseType = "";
          updatedValues.expenseParameter = "";
          dropdownConfigs.forEach((config) => {
            if (prevSelectedValues[config.name]) {
              updatedValues[config.name] = "";
            }
          });
        } else {
          setIsLoadingApi(false);
          setExpenseTypeOptions([]);
          setExpenseParameterOptions([]);
        }
      } else if (fieldName === "expenseType") {
        updatedValues.expenseParameter = "";
        dropdownConfigs.forEach((config) => {
          if (prevSelectedValues[config.name]) {
            updatedValues[config.name] = "";
          }
        });
      }

      return updatedValues;
    });
  };

  const areAll3SelectsPopulated =
    selectedValues.purchaseCompany && selectedValues.expenseType && selectedValues.expenseParameter;

  const handleSnackbarClose = (event, reason) => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const areInitialSelectsPopulated =
      selectedValues.purchaseCompany &&
      selectedValues.expenseType &&
      selectedValues.expenseParameter;

    const areDynamicSelectsPopulated = dropdownConfigs.every(
      (config) => selectedValues[config.name]
    );

    setAllSelectsPopulated(areInitialSelectsPopulated && areDynamicSelectsPopulated);
  }, [dropdownConfigs, selectedValues]);

  useEffect(() => {
    if (selectedValues.purchaseCompany) {
      fetchFilters();
    }
  }, [selectedValues.purchaseCompany]);

  async function fetchFilters() {
    const headers = getHeaders(env);

    const params: any = {
      market_id: selectedValues.purchaseCompany || undefined,
    };

    try {
      const { data } = await axios.get(
        "https://gst-cost-service.dev.walmart.com/ratemgmt/filters",
        {
          params: {
            market_id: selectedValues.purchaseCompany,
          },
          headers: headers,
        }
      );
      setFilterData(data);
    } catch (error) {
      console.error("Error trying to fetch filters:", error);
    } finally {
      setTimeout(() => {
        setIsLoadingApi(false);
      }, 1500);
    }
  }

  const isRateActive = (rate) => {
    const today = new Date();
    const terminationDate = new Date(rate.termination_date);
    return terminationDate >= today;
  };

  async function fetchRates(filterValues, fetchAll = false) {
    setIsFetching(true);
    if (!allSelectsPopulated) {
      return;
    }
    const headers = getHeaders(env);
    const payload = { ...filterValues };
    Object.keys(payload).forEach((key) => payload[key] === "" && delete payload[key]);

    try {
      const { data } = await axios.post(
        "https://gst-cost-service.dev.walmart.com/ratemgmt/rates/getratelist",
        payload,
        { headers }
      );
      setAllRatesData(data.data);
      const activeRates = data.data.filter((rate) => isRateActive(rate));
      setRatesData(activeRates);
      setRefreshRates(false);
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setIsFetching(false);
    }
  }

  function hasExpired(expirationDate: string): boolean {
    const currentDate = new Date();
    const rateExpirationDate = new Date(expirationDate);
    return rateExpirationDate < currentDate;
  }

  const handleAddRateSuccess = (newRate) => {
    if (!refreshRates) {
      setRefreshRates(true);
    }
  };

  const handleEditRateSuccess = (newRate) => {
    setRefreshRates(true);
    setForceUpdate((prev) => prev + 1);
  };

  const getDropdownsConfig = (selectedValues: any, filterData: any): any[] => {
    const { purchaseCompany, expenseType, expenseParameter } = selectedValues;

    if (!filterData || !filterData.elements) {
      return [];
    }

    const selectedExpense = filterData.elements.find((el: any) => el.element_id === expenseType);

    if (!selectedExpense || !selectedExpense.factors) {
      return [];
    }

    const selectedFactor = selectedExpense.factors.find(
      (f: any) => f.subtype_id === expenseParameter
    );

    if (!selectedFactor || !selectedFactor.filters) {
      return [];
    }

    return selectedFactor.filters;
  };

  const dropdownToApiLinkMap = {
    loadingPort: "port",
    originCountry: "country",
    entryPort: "port",
    importCountry: "country",
    destination: "port",
  };
  const getOptionsForDropdown = (dropdownName: string) => {
    const apiLinkName = dropdownToApiLinkMap[dropdownName] || dropdownName;
    return linkOptions[apiLinkName] || [];
  };

  const handleChangePageRatesData = (event, newPage) => {
    setPageRatesData(newPage);
  };

  const handleChangeRowsPerPageRatesData = (event) => {
    setRowsPerPageRatesData(+event.target.value);
    setPageRatesData(0);
  };

  const handlePaginationChangeRatesData = (event, value) => {
    setPageRatesData(value - 1);
  };

  const handleGotoPageChangeRatesData = (event) => {
    setGotoPageRatesData(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      jumpToPageRatesData();
    }
  };

  const gotoPageInputRef = useRef(null);

  const jumpToPageRatesData = () => {
    const pageNumber = +gotoPageRatesData - 1;
    setPageRatesData(pageNumber);
    setGotoPageRatesData("");
  };

  async function deleteRate(effectiveDate) {
    const isConfirmed = window.confirm("Are you sure you want to delete this rate?");
    if (!isConfirmed) {
      return;
    }
    const deletePayload = {
      ...filterValues,
      effective_date: effectiveDate,
    };
    Object.keys(deletePayload).forEach((key) => {
      if (deletePayload[key] === "") {
        delete deletePayload[key];
      }
    });
    const headers = getHeaders(env);
    try {
      const response = await axios.delete(
        "https://gst-cost-service.dev.walmart.com/ratemgmt/rates/rate",
        {
          headers: headers,
          data: deletePayload,
        }
      );
      window.alert("Rate deleted!");
      console.log("Rate deleted successfully");
      fetchRates(filterValues);
    } catch (error) {
      console.error("Error deleting rate:", error);
    }
  }

  const formatDataForExcel = (data) => {
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

    return data.map((entry) => {
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
      if (selectedValues.transportMode) {
        result["Transport Mode"] = findLabelByValue("transportMode", entry.transport_mode);
      }
      if (selectedValues.loadingPort) {
        result["Loading Port"] = findLabelByValue("port", selectedValues.loadingPort);
      }
      if (entry.loading_port_id) {
        if (typeof entry.loading_port_id === "string" && entry.loading_port_id.includes("-")) {
          result["Loading Port"] = entry.loading_port_id;
        } else {
          result["Loading Port"] = findLabelByValue("port", entry.loading_port_id);
        }
      }
      if (selectedValues.entryPort) {
        result["Entry Port"] = findLabelByValue("port", entry.entry_port_id);
      }
      if (selectedValues.container) {
        result["Container Type"] = findLabelByValue("container", entry.container_type_id);
      }
      if (entry.container_type_id && !selectedValues.container) {
        result["Container Type"] = entry.container_type_id;
      }
      if (selectedValues.destinationPort) {
        result["Destination Port"] = findLabelByValue("port", entry.destination_port_id);
      }
      if (selectedValues.agentOffice) {
        result["Agent Office"] = findLabelByValue("agentOffice", entry.agent_office_id);
      }

      if (entry.agent_office_id && !selectedValues.agentOffice) {
        result["Agent Office"] = entry.agent_office_id;
      }

      if (selectedValues.department) {
        result["Department"] = findLabelByValue("department", entry.department_id);
      }

      if (entry.department_id && !selectedValues.department) {
        result["Department"] = entry.department_id;
      }

      if (selectedValues.country) {
        result["Origin Country"] = findLabelByValue("originCountry", entry.origin_country_id);
      }

      if (entry.origin_country_id && !selectedValues.country) {
        result["Origin Country"] = entry.origin_country_id;
      }

      if (selectedValues.importCountry) {
        result["Import Country"] = findLabelByValue("importCountry", entry.import_country_id);
      }

      if (entry.import_country_id && !selectedValues.importCountry) {
        result["Import Country"] = entry.import_country_id;
      }

      if (selectedValues.taxCategory) {
        result["Tax Category"] = findLabelByValue("taxCategory", entry.tax_category_id);
      }

      if (entry.tax_category_id && !selectedValues.taxCategory) {
        result["Tax Category"] = entry.tax_category_id;
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
  };

  const exportToExcel = (data) => {
    const formattedData = formatDataForExcel(data);
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rates");
    XLSX.writeFile(wb, "rates.xlsx");
  };

  console.log("Rates Data costfactors:", ratesData);

  async function fetchAndProcessRates(filterCriteria, map, subtypeId) {
    const rates = [];
    const validIds = Array.from(map.keys());

    for (let i = 0; i < validIds.length; i++) {
      const id = validIds[i];
      const filters = { ...filterCriteria, [subtypeId]: id };
      try {
        const response = await axios.post(
          "https://gst-cost-service.dev.walmart.com/ratemgmt/rates/getratelist",
          filters,
          {
            headers: getHeaders(env),
          }
        );
        if (response.data && response.data.data) {
          rates.push(
            ...response.data.data.map((rate) => ({
              ...rate,
              [subtypeId]: map.get(rate[subtypeId]) || rate[subtypeId],
            }))
          );
        }
      } catch (error) {
        console.error(`Error fetching rates for ID: ${id}`, error);
      }
      updateProgress(i, validIds.length);
    }
    return rates;
  }

  function updateProgress(currentIndex, totalLength) {
    setProgress(((currentIndex + 1) / totalLength) * 100);
  }

  const downloadRatesToExcel = async () => {
    const baseFilters = { ...filterValues };
    Object.keys(baseFilters).forEach((key) => {
      if (baseFilters[key] === "") {
        delete baseFilters[key];
      }
    });

    const portLink = filterData.links.find((link) => link.link_name === "port");
    const departmentLink = filterData.links.find((link) => link.link_name === "department");
    if (!portLink || !departmentLink) {
      console.error("Required link not found in filter data.");
      return;
    }
    const containerLink = filterData.links.find((link) => link.link_name === "container");
    const transportLink = filterData.links.find((link) => link.link_name === "transportMode");
    const agentOfficeLink = filterData.links.find((link) => link.link_name === "agentOffice");
    const originCountryLink = filterData.links.find((link) => link.link_name === "country");
    const taxCategoryLink = filterData.links.find((link) => link.link_name === "taxCategory");
    const importCountryLink = filterData.links.find((link) => link.link_name === "country");

    const agentOfficeMap = new Map(agentOfficeLink.data.map((item) => [item.value, item.label]));
    const originCountryMap = new Map(
      originCountryLink.data.map((item) => [item.value, item.label])
    );
    const taxCategoryMap = new Map(taxCategoryLink.data.map((item) => [item.value, item.label]));

    const importCountryMap = new Map(
      importCountryLink.data.map((item) => [item.value, item.label])
    );
    const transportMap = new Map(transportLink.data.map((trans) => [trans.value, trans.label]));
    const containerMap = new Map(containerLink.data.map((cont) => [cont.value, cont.label]));
    const departmentMap = new Map(departmentLink.data.map((dept) => [dept.value, dept.label]));
    const portMap = new Map(portLink.data.map((port) => [port.value, port.label]));

    try {
      const allData = [];

      if (
        !selectedValues.loadingPort &&
        [51, 53].includes(Number(selectedValues.expenseParameter))
      ) {
        allData.push(...(await fetchAndProcessRates(baseFilters, portMap, "loading_port_id")));
      }

      if (
        !selectedValues.entryPort &&
        [51, 53, 60, 61].includes(Number(selectedValues.expenseParameter))
      ) {
        allData.push(...(await fetchAndProcessRates(baseFilters, portMap, "entry_port_id")));
      }

      if (
        !selectedValues.department &&
        [80, 81].includes(Number(selectedValues.expenseParameter))
      ) {
        allData.push(...(await fetchAndProcessRates(baseFilters, departmentMap, "department_id")));
      }

      if (
        !selectedValues.container &&
        [51, 53, 61].includes(Number(selectedValues.expenseParameter))
      ) {
        allData.push(
          ...(await fetchAndProcessRates(baseFilters, containerMap, "container_type_id"))
        );
      }

      if (
        !selectedValues.transportMode &&
        [51, 53].includes(Number(selectedValues.expenseParameter))
      ) {
        allData.push(...(await fetchAndProcessRates(baseFilters, transportMap, "transport_mode")));
      }

      if (!selectedValues.agentOffice && [31].includes(Number(selectedValues.expenseParameter))) {
        allData.push(
          ...(await fetchAndProcessRates(baseFilters, agentOfficeMap, "agent_office_id"))
        );
      }

      if (!selectedValues.originCountry && [40].includes(Number(selectedValues.expenseParameter))) {
        allData.push(...(await fetchAndProcessRates(baseFilters, originCountryMap, "country")));
      }

      if (!selectedValues.taxCategory && [41].includes(Number(selectedValues.expenseParameter))) {
        allData.push(...(await fetchAndProcessRates(baseFilters, taxCategoryMap, "taxCategory")));
      }

      if (!selectedValues.importCountry && [41].includes(Number(selectedValues.expenseParameter))) {
        allData.push(
          ...(await fetchAndProcessRates(baseFilters, importCountryMap, "importCountry"))
        );
      }

      exportToExcel(allData.length ? allData : "No rates found with the selected filters.");
    } catch (error) {
      console.error("Error downloading rates:", error);
      setSnackbarMessage("An error occurred while downloading rates.");
      setSnackbarOpen(true);
    }
    setProgress(0);
  };

  const allData = [...allRatesData, ...uploadedRates];

  useEffect(() => {
    const start = pageRatesData * rowsPerPageRatesData;
    const end = start + rowsPerPageRatesData;
    setStartIndex(start);
    setEndIndex(end);
  }, [pageRatesData, rowsPerPageRatesData]);

  useEffect(() => {
    if (gotoPageInputRef.current) {
      gotoPageInputRef.current.focus();
    }
  }, [gotoPageRatesData]);

  useEffect(() => {
    const start = pageUploadedRates * rowsPerPageUploadedRates;
    const end = start + rowsPerPageUploadedRates;
    setStartIndex(start);
    setEndIndex(end);
  }, [pageUploadedRates, rowsPerPageUploadedRates]);

  useEffect(() => {
    const configs = getDropdownsConfig(selectedValues, filterData);
    setDropdownConfigs(configs);
  }, [selectedValues, filterData]);

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

  useEffect(() => {
    if (filterData && filterData.links) {
      const tempLinkOptions = {};
      filterData.links.forEach((link) => {
        tempLinkOptions[link.link_name] = link.data;
      });
      setLinkOptions(tempLinkOptions);
    }
  }, [filterData]);
  const lastFetchedFiltersRef = useRef({});

  useEffect(() => {
    const allSelectsFilled =
      selectedValues.purchaseCompany &&
      selectedValues.expenseType &&
      selectedValues.expenseParameter &&
      dropdownConfigs.every((config) => selectedValues[config.name]);

    const currentFilterValues = JSON.stringify(filterValues);
    const lastFetchedFilterValues = lastFetchedFiltersRef.current;

    if (allSelectsFilled && currentFilterValues !== lastFetchedFilterValues) {
      setIsFetching(true);
      fetchRates(filterValues)
        .then(() => {
          lastFetchedFiltersRef.current = currentFilterValues;
        })
        .catch((error) => {
          console.error("Error fetching rates:", error);
        })
        .finally(() => {
          setTimeout(() => {
            setIsFetching(false);
          }, 2000);
        });
    }
  }, [selectedValues, dropdownConfigs, filterValues]);

  useEffect(() => {
    if (refreshRates) {
      fetchRates(filterValues);
      setRefreshRates(false);
    }
  }, [refreshRates, filterValues]);

  return (
    <div style={{ height: "100vh", overflowY: "auto" }}>
      <>
        {progress > 0 && <LinearProgress variant="determinate" value={progress} />}
        <div>
          <Divider></Divider>
        </div>
        <div style={{ position: "relative", zIndex: "1", marginTop: "5%" }}>
          <Grid container spacing={2} alignItems="center" direction="row">
            <AutocompleteSelect
              label="Purchase company"
              options={purchaseCompanyOptions}
              selectedValue={selectedValues.purchaseCompany}
              onChange={handleSelectChange}
              name="purchaseCompany"
            />
            <AutocompleteSelect
              label="Element"
              options={expenseTypeOptions}
              selectedValue={selectedValues.expenseType}
              onChange={handleSelectChange}
              name="expenseType"
            />
            <AutocompleteSelect
              label="Factor"
              options={expenseParameterOptions}
              selectedValue={selectedValues.expenseParameter}
              onChange={handleSelectChange}
              name="expenseParameter"
            />
          </Grid>
          {areAll3SelectsPopulated && (
            <>
              <Grid container spacing={2} direction="row">
                {dropdownConfigs.map((config, index) => (
                  <AutocompleteSelect
                    key={config.name}
                    label={config.displayLabel}
                    options={getOptionsForDropdown(config.name)}
                    selectedValue={selectedValues[config.name]}
                    onChange={handleSelectChange}
                    name={config.name}
                  />
                ))}
              </Grid>
            </>
          )}
          <Divider style={{ margin: "24px 0px" }}></Divider>
          {allSelectsPopulated ? (
            <>
              <StyledContainer style={{ width: "100%", maxHeight: "1200px", overflowY: "auto" }}>
                {ratesData
                  .filter((data) => !hasExpired(data.termination_date))
                  .slice(startIndex, endIndex)
                  .map((data, index) => (
                    <RatesTable
                      key={index}
                      isSecondTable={index >= 1}
                      isFuture={isExpiringSoon(data.termination_date)}
                      rateValue={data.rate_value}
                      effectiveDate={data.effective_date}
                      expirationDate={data.termination_date}
                      currency={data.currency_code}
                      rateType={data.rate_type}
                      rateBasis={data.per_uom_code}
                      ratesData={allData}
                      filterData={filterData}
                      selectedValues={selectedValues}
                      onDeleteRate={deleteRate}
                      onHistoryClick={() => {
                        const allData = [...allRatesData, ...uploadedRates];
                        setSelectedRateData(allData);
                      }}
                      onEditRateSuccess={handleEditRateSuccess}
                    />
                  ))}
                <Divider></Divider>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <PaginationComponent
                    dataLength={ratesData.length}
                    page={pageRatesData}
                    rowsPerPage={rowsPerPageRatesData}
                    handleChangePage={handleChangePageRatesData}
                    handleChangeRowsPerPage={handleChangeRowsPerPageRatesData}
                    handlePaginationChange={handlePaginationChangeRatesData}
                    gotoPage={gotoPageRatesData}
                    onKeyDown={handleKeyDown}
                    handleGotoPageChange={handleGotoPageChangeRatesData}
                    jumpToPage={jumpToPageRatesData}
                  />
                </div>
              </StyledContainer>
              <div style={{ marginTop: "24px" }}>
                <ApplyButton
                  onClick={() => {
                    setShowAddRateModal(true);
                    setActiveRateData(ratesData);
                  }}
                >
                  Add Rate
                </ApplyButton>
              </div>
            </>
          ) : (
            <>
              <StyledContainer style={{ width: "100%" }}>
                <LoadingRates />
              </StyledContainer>
            </>
          )}
          {showAddRateModal && activeRateData && (
            <AddRateModal
              open={showAddRateModal}
              onClose={() => {
                setShowAddRateModal(false);
              }}
              rateValue={activeRateData.rate_value}
              effectiveDate={activeRateData.effective_date}
              expirationDate={activeRateData.termination_date}
              currency={activeRateData.currency_code}
              rateType={activeRateData.rate_type}
              rateBasis={activeRateData.per_uom_code}
              ratesData={ratesData}
              onAddRateClick={(data) => setSelectedRateData(data)}
              selectedValues={selectedValues}
              onAddRateSuccess={handleAddRateSuccess}
            />
          )}
        </div>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setSnackbarOpen(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
        {isLoadingApi && (
          <Backdrop
            sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={isLoadingApi}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        )}
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isFetching}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </>
    </div>
  );
}

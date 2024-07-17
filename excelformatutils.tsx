export const formatDataForExcel = (
    data,
    filterData,
    selectedValues,
    purchaseCompanyOptions,
    expenseTypeOptions,
    expenseParameterOptions
  ) => {
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
        result["*Purchase Company"] = findLabelInOptions(
          selectedValues.purchaseCompany,
          purchaseCompanyOptions
        );
      }
      if (selectedValues.expenseType) {
        result["*Element"] = findLabelInOptions(selectedValues.expenseType, expenseTypeOptions);
      }
      if (selectedValues.expenseParameter) {
        result["*Factor"] = findLabelInOptions(
          selectedValues.expenseParameter,
          expenseParameterOptions
        );
      }
      if (selectedValues.transportMode) {
        result["*Transport Mode"] = findLabelByValue("transportMode", entry.transport_mode);
      }
      if (selectedValues.loadingPort) {
        result["*Loading Port"] = findLabelByValue("port", selectedValues.loadingPort);
      }
      if (entry.loading_port_id) {
        if (typeof entry.loading_port_id === "string" && entry.loading_port_id.includes("-")) {
          result["*Loading Port"] = entry.loading_port_id;
        } else {
          result["*Loading Port"] = findLabelByValue("port", entry.loading_port_id);
        }
      }
      if (selectedValues.entryPort) {
        result["*Entry Port"] = findLabelByValue("port", entry.entry_port_id);
      }
      if (selectedValues.container) {
        result["*Container Type"] = findLabelByValue("container", entry.container_type_id);
      }
      if (entry.container_type_id && !selectedValues.container) {
        result["*Container Type"] = entry.container_type_id;
      }
      if (selectedValues.destinationPort) {
        result["*Destination Port"] = findLabelByValue("port", entry.destination_port_id);
      }
      if (selectedValues.agentOffice) {
        result["*Agent Office"] = findLabelByValue("agentOffice", entry.agent_office_id);
      }
  
      if (entry.agent_office_id && !selectedValues.agentOffice) {
        result["*Agent Office"] = entry.agent_office_id;
      }
  
      if (selectedValues.department) {
        result["*Department"] = findLabelByValue("department", entry.department_id);
      }
  
      if (entry.department_id && !selectedValues.department) {
        result["*Department"] = entry.department_id;
      }
  
      if (selectedValues.country) {
        result["*Origin Country"] = findLabelByValue("originCountry", entry.origin_country_id);
      }
  
      if (entry.origin_country_id && !selectedValues.country) {
        result["*Origin Country"] = entry.origin_country_id;
      }
  
      if (selectedValues.importCountry) {
        result["*Import Country"] = findLabelByValue("importCountry", entry.import_country_id);
      }
  
      if (entry.import_country_id && !selectedValues.importCountry) {
        result["*Import Country"] = entry.import_country_id;
      }
  
      if (selectedValues.taxCategory) {
        result["*Tax Category"] = findLabelByValue("taxCategory", entry.tax_category_id);
      }
  
      if (entry.tax_category_id && !selectedValues.taxCategory) {
        result["*Tax Category"] = entry.tax_category_id;
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
  
  export const formatDataForExcelUploaded = (
    uploadedRates,
    responseObjects,
    filterData,
    selectedValues,
    purchaseCompanyOptions,
    expenseTypeOptions,
    expenseParameterOptions
  ) => {
    const findLabelInOptions = (value, options) => {
      const foundOption = options.find((option) => option.value === value);
      return foundOption ? foundOption.label : "Label not found";
    };
  
    const convertToLabels = (entry) => {
      let result = {};
  
      result["*Purchase Company"] =
        findLabelInOptions(entry.market_id, purchaseCompanyOptions) || "Label not found";
      result["*Element"] =
        findLabelInOptions(entry.element_id, expenseTypeOptions) || "Label not found";
      result["*Factor"] =
        findLabelInOptions(entry.element_subtype_id, expenseParameterOptions) || "Label not found";
  
      return result;
    };
  
    return uploadedRates.map((entry, index) => {
      const responseObject = responseObjects[index];
  
      const labeledEntry = convertToLabels(entry);
  
      let result = {
        ...labeledEntry,
        "Effective Date": entry.effective_date,
        "Termination Date": entry.termination_date,
        "Rate Type": entry.rate_type,
        "Rate Value": entry.rate_value,
        "Currency Code": entry.currency_code || "",
        "Unit of Measure": entry.per_uom_code || "",
        "Update User ID": entry.update_user_id,
        "Create TS": entry.create_ts,
        "Update TS": entry.update_ts,
        Remarks: responseObject.remarks,
      };
  
      return result;
    });
  };
  
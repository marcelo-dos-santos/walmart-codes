import React, { useEffect, useState } from "react";
import { Container, Dialog, DialogContent, LinearProgress, Snackbar } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UploadButton, ApplyButton } from "./CustomApplyButton";
import * as XLSX from "xlsx";
import { getEnv, getHeaders } from "../../utils/EnvConfig";
import { config } from "../../utils/config";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";

//

interface UploadRatesModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (newRates: any) => void;
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

interface UploadedRecord {
  rate_value: string;
  effective_date: string;
  termination_date: string;
  rate_type: string;
  currency_code: string;
  uom_code: string;
  market_id: number;
  element_id: number;
  element_subtype_id: number;
  container_type_id: number;
  entry_port_id: number;
  loading_port_id: number;
  transport_mode: number;
}

const UploadContainer = styled(Container)({
  width: "552px",
  height: "196px",
  margin: "16px 0 24px 0",
  borderRadius: "12px",
  border: "1px dashed rgba(144, 145, 150, 1)",
  padding: "16px 0px 8px 0px",
  backgroundColor: "rgba(248, 248, 248, 1)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  cursor: "pointer",
});

const titleStyle = {
  fontFamily: "Bogle",
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: "36px",
};

const textStyle = {
  fontFamily: "Bogle",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "20px",
  color: "rgba(46, 47, 50, 1)",
};

const linkStyle = {
  fontFamily: "Bogle",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "24px",
  textDecoration: "underline",
  color: "rgba(46, 47, 50, 1)",
  transition: "filter 0.3s ease",
};

const buttonStyle = {
  display: "flex",
  alignItems: "center",
  marginTop: "20px",
  justifyContent: "flex-end",
  gap: "16px",
};

const ACCEPTED_FILE_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "text/xml",
  "text/csv",
];

const progressBackdropStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const progressMessageStyle = {
  marginTop: "20px",
  fontFamily: "Bogle",
  fontSize: "18px",
  color: "#fff",
};

const linearProgressStyle = {
  height: "10px",
  borderRadius: "5px",
  backgroundColor: "lightgrey",
  marginBottom: "10px",
};

const linearBarStyle = {
  backgroundColor: "rgba(46, 47, 50, 1)",
};

export const UploadRatesModal: React.FC<UploadRatesModalProps> = ({
  open,
  onClose,
  onUploadComplete,
  selectedValues,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedRates, setUploadedRates] = useState([]);
  const [isValidFile, setIsValidFile] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileProcessingProgress, setFileProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  let env: {
    headers: any;
  };

  useEffect(() => {
    env = getEnv(config);
  });

  const updateProgress = (increment) => {
    setFileProcessingProgress((prevProgress) => {
      const newProgress = prevProgress + increment;
      return newProgress > 100 ? 100 : newProgress;
    });
  };

  function transformSelectedValues(selectedValues) {
    return {
      market_id: Number(selectedValues.purchaseCompany),
      element_id: Number(selectedValues.expenseType),
      element_subtype_id: Number(selectedValues.expenseParameter),
      loading_port_id: Number(selectedValues.loadingPort),
      entry_port_id: Number(selectedValues.entryPort),
      transport_mode: Number(selectedValues.transportMode),
      container_type_id: Number(selectedValues.container),
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
  }

  function extractNumber(str) {
    if (typeof str === "string") {
      const matches = str.match(/\d+/);
      return matches ? Number(matches[0]) : null;
    }
    return null;
  }

  function isValidDateFormat(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateStr);
  }

  function serialToDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000 + new Date().getTimezoneOffset() * 60 * 1000);

    const year = date_info.getUTCFullYear();
    const month = (date_info.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date_info.getUTCDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const processFile = (file: File) => {
    if (ACCEPTED_FILE_TYPES.includes(file.type)) {
      setSelectedFile(file);
      setIsProcessing(true);
      updateProgress(30);
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setTimeout(() => {
          updateProgress(60);
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          setTimeout(() => {
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const parsedData: UploadedRecord[] = XLSX.utils.sheet_to_json(worksheet);

            const uniqueRecords = parsedData.filter((record, index, self) => {
              const stringified = JSON.stringify(record);
              return index === self.findIndex((r) => JSON.stringify(r) === stringified);
            });

            const transformedData = uniqueRecords.map((record: any) => {
              let effective_date = record["Effective Date"].toString();
              let termination_date = record["Termination Date"].toString();

              if (!isValidDateFormat(effective_date)) {
                effective_date = serialToDate(record["Effective Date"]);
              }

              if (!isValidDateFormat(termination_date)) {
                termination_date = serialToDate(record["Termination Date"]);
              }

              return {
                market_id: extractNumber(record["Purchase Company"]),
                element_id: extractNumber(record["Element"]),
                element_subtype_id: extractNumber(record["Factor"]),
                loading_port_id: extractNumber(record["Loading Port"]),
                transport_mode: extractNumber(record["Transport Mode"]),
                entry_port_id: extractNumber(record["Entry Port"]),
                container_type_id: extractNumber(record["Container Type"]),
                destination_port_id: extractNumber(record["Destination Port"]),
                agent_office_id: extractNumber(record["Agent Office"]),
                department_id: extractNumber(record["Department"]),
                origin_country_id: extractNumber(record["Origin Country"]),
                import_country_id: extractNumber(record["Import Country"]),
                tax_category_id: extractNumber(record["Tax Category"]),
                rate_value: record["Rate Value"],
                effective_date: effective_date,
                termination_date: termination_date,
                currency_code: record["Currency Code"],
                rate_type: record["Rate Type"],
                per_uom_code: record["Unit of Measure"],
                update_user_id: record["Update User ID"],
              };
            });

            setUploadedRates(transformedData);
            setFileProcessingProgress(100);
            setIsProcessing(false);
          }, 1500);
        }, 1500);
      };
      reader.readAsBinaryString(file);
    } else {
      setSnackbarMessage(
        "Invalid file type. Please upload XLS, XLSM, XLSX, XML, or CSV files only."
      );
      setFileProcessingProgress(100);
      setSnackbarOpen(true);
      setSelectedFile(null);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    setSnackbarOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      processFile(file);
      setFileProcessingProgress(0);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const openFileDialog = () => {
    const input: HTMLElement | null = document.getElementById("fileInput");
    input && input.click();
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadedRates([]);
    setFileProcessingProgress(0);
    onClose();
  };

  const transformedValues = transformSelectedValues(selectedValues);

  const payload = {
    ...transformedValues,
    uploadedRates,
    update_user_id: "mfromer",
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") delete payload[key];
  });

  const handleSave = async () => {
    if (!selectedFile) {
      setSnackbarMessage("No file selected. Please upload a file before saving.");
      setSnackbarOpen(true);
      return;
    }
    setIsUploading(true);
    setTimeout(async () => {
      if (isValidFile) {
        try {
          console.log("This is the uploaded rates", payload);
          const headers = getHeaders(env);
          const responseObjects = [];

          uploadedRates.forEach((rate, index) => {
            const newRate = {
              ...payload,
              row_id: index + 1,
              ...rate,
            };
            Object.keys(newRate).forEach((key) => {
              if (newRate[key] === "") delete newRate[key];
            });
            responseObjects.push(newRate);
          });
          console.log("Payload before sending to backend:", responseObjects);
          const response = await axios.post(
            "https://gst-cost-service.dev.walmart.com/ratemgmt/rates/ratelist",
            responseObjects,
            {
              headers,
            }
          );
          if (response.status === 200) {
            console.log("Upload complete:", responseObjects);
            await onUploadComplete(responseObjects);
          } else {
            console.error("Upload Failed:", response.statusText);
          }
        } catch (error) {
          console.error("Error trying to upload:", error);
        }
      }
      setIsUploading(false);
      handleClose();
    }, 1500);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={false}>
      <DialogContent>
        <div className="uploadratesmodal">
          <div className="uploadratesmodalcontent">
            <div
              className="title"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "-20px",
              }}
            >
              <h2 style={titleStyle}>Bulk Upload Rates</h2>
              <span
                className="close-button"
                style={{ fontSize: "24px", cursor: "pointer" }}
                onClick={handleClose}
              >
                &times;
              </span>
            </div>
            <div
              className="download-section"
              style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "20px" }}
            >
              <span style={textStyle}>Use our template to import your rates data.</span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}></span>
            </div>
            <UploadContainer
              data-cy="upload-container"
              onClick={openFileDialog}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M20.6129 17.2097L20.7071 17.2929L23.7071 20.2929C24.0976 20.6834 24.0976 21.3166 23.7071 21.7071C23.3466 22.0676 22.7794 22.0953 22.3871 21.7903L22.2929 21.7071L21 20.415V28L20.9933 28.1166C20.9355 28.614 20.5128 29 20 29C19.4872 29 19.0645 28.614 19.0067 28.1166L19 28V20.415L17.7071 21.7071C17.3466 22.0676 16.7794 22.0953 16.3871 21.7903L16.2929 21.7071C15.9324 21.3466 15.9047 20.7794 16.2097 20.3871L16.2929 20.2929L19.2929 17.2929C19.6534 16.9324 20.2206 16.9047 20.6129 17.2097ZM16.9308 3C21.6473 3 25.5665 6.57236 26.1903 11.2362L26.214 11.436L26.3662 11.5182C28.5001 12.7237 29.9009 14.9922 29.9949 17.536L30 17.8095C30 21.702 27.0176 24.8684 23.2373 24.996L23 25V23C25.7717 23 28 20.6936 28 17.8095C28 15.6856 26.7481 13.8039 24.8749 13.0096C24.5223 12.86 24.2861 12.5222 24.2666 12.1396C24.0636 8.14273 20.8381 5 16.9308 5C13.1693 5 10.0193 7.91892 9.62686 11.7359C9.57714 12.2195 9.18678 12.5973 8.70179 12.6312C6.06799 12.8151 4 15.0714 4 17.8095C4 20.6076 6.15155 22.8807 8.83719 22.9955L9.05029 23H17V25H9.05029C5.15133 25 2 21.7757 2 17.8095C2 14.3572 4.39514 11.4438 7.61986 10.7671L7.751 10.741C8.56407 6.39214 12.2503 3.13005 16.6651 3.0038L16.9308 3Z"
                  fill="black"
                />
              </svg>
              <p style={textStyle}>Drag and drop file here</p>
              <ApplyButton>Click to upload</ApplyButton>
              <p style={textStyle}>
                File Types: XLS, XLSM, XLSX, XML, CSV. <br /> Max size: 10 MB
              </p>
            </UploadContainer>
            {isProcessing && (
              <LinearProgress
                variant="determinate"
                value={fileProcessingProgress}
                style={linearProgressStyle}
                sx={{
                  "& .MuiLinearProgress-bar": linearBarStyle,
                }}
              />
            )}
            <input
              type="file"
              id="fileInput"
              data-cy="fileInput"
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept=".xls,.xlsm,.xlsx,.xml,.csv"
            />
            {selectedFile && (
              <div
                className="uploadedFile"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M20.75 0.5C21.1297 0.5 21.4435 0.782154 21.4932 1.14823L21.5 1.25V17.75C21.5 19.7543 19.9276 21.3913 17.9492 21.4948L17.75 21.5H5C2.51472 21.5 0.5 19.4853 0.5 17C0.5 16.6203 0.782154 16.3065 1.14823 16.2568L1.25 16.25H2.75V1.25C2.75 0.870304 3.03215 0.556509 3.39823 0.506847L3.5 0.5H20.75ZM14 17.75H2.096L2.12263 17.8517C2.47374 19.0397 3.54055 19.9206 4.82373 19.9949L5 20L14.7506 20.0012C14.3265 19.437 14.0578 18.7491 14.0083 18.0014L14 17.75ZM20 2H4.25V16.249L14.75 16.25C15.0952 16.25 15.3859 16.4832 15.4732 16.8006L15.4932 16.8982L15.5 17V17.75C15.5 18.9926 16.5074 20 17.75 20C18.9409 20 19.9156 19.0748 19.9948 17.904L20 17.75V2ZM16.25 11C16.6642 11 17 11.3358 17 11.75C17 12.1297 16.7178 12.4435 16.3518 12.4932L16.25 12.5H6.52629C6.11207 12.5 5.77629 12.1642 5.77629 11.75C5.77629 11.3703 6.05844 11.0565 6.42452 11.0068L6.52629 11H16.25ZM13.25 8C13.6642 8 14 8.33579 14 8.75C14 9.1297 13.7178 9.44349 13.3518 9.49315L13.25 9.5H6.52629C6.11207 9.5 5.77629 9.16421 5.77629 8.75C5.77629 8.3703 6.05844 8.05651 6.42452 8.00685L6.52629 8H13.25ZM10.25 5C10.6642 5 11 5.33579 11 5.75C11 6.1297 10.7178 6.44349 10.3518 6.49315L10.25 6.5H6.52629C6.11207 6.5 5.77629 6.16421 5.77629 5.75C5.77629 5.3703 6.05844 5.05651 6.42452 5.00685L6.52629 5H10.25Z"
                    fill="black"
                  />
                </svg>
                <span style={{ ...linkStyle, cursor: "pointer" }}>{selectedFile.name}</span>
                <svg
                  className="deleteFile"
                  data-cy="delete-file-button"
                  data-testid="delete-file-button"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadedRates([]);
                  }}
                  width="12"
                  height="14"
                  viewBox="0 0 12 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ cursor: "pointer" }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 0C8.27614 0 8.5 0.223858 8.5 0.5L8.499 2H11.5C11.7761 2 12 2.22386 12 2.5C12 2.74546 11.8231 2.94961 11.5899 2.99194L11.5 3H10.499L10.5 13.5C10.5 13.7761 10.2761 14 10 14H2C1.72386 14 1.5 13.7761 1.5 13.5L1.499 3H0.5C0.223858 3 0 2.77614 0 2.5C0 2.25454 0.176875 2.05039 0.410124 2.00806L0.5 2H3.499L3.5 0.5C3.5 0.223858 3.72386 0 4 0H8ZM9.4996 3H2.4996V13H9.4996V3ZM7.5 4.5C7.74546 4.5 7.94961 4.67688 7.99194 4.91012L8 5V11C8 11.2761 7.77614 11.5 7.5 11.5C7.25454 11.5 7.05039 11.3231 7.00806 11.0899L7 11V5C7 4.72386 7.22386 4.5 7.5 4.5ZM4.5 4.5C4.74546 4.5 4.94961 4.67688 4.99194 4.91012L5 5V11C5 11.2761 4.77614 11.5 4.5 11.5C4.25454 11.5 4.05039 11.3231 4.00806 11.0899L4 11V5C4 4.72386 4.22386 4.5 4.5 4.5ZM7.4996 1H4.4996V2H7.4996V1Z"
                    fill="black"
                  />
                </svg>
              </div>
            )}
            <div className="buttons" style={buttonStyle}>
              <a href="#" style={linkStyle} onClick={handleClose}>
                Cancel
              </a>
              <UploadButton onClick={handleSave}>Save</UploadButton>
            </div>
          </div>
        </div>
      </DialogContent>
      <Backdrop
        sx={{ ...progressBackdropStyle, zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isUploading || isProcessing}
      >
        <CircularProgress color="inherit" />
        <p style={progressMessageStyle}>
          {isProcessing ? "Processing archive..." : "Uploading data..."}
        </p>
      </Backdrop>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Dialog>
  );
};

export default UploadRatesModal;

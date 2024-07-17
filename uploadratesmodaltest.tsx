import React from "react";
import { render, fireEvent, act, waitFor, getByTestId } from "@testing-library/react";
import UploadRatesModal from "../UploadRatesModal";
import XLSX from "xlsx";
import userEvent from "@testing-library/user-event";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

jest.mock("xlsx", () => {
  const originalXLSX = jest.requireActual("xlsx");

  return {
    ...originalXLSX,
    utils: {
      ...originalXLSX.utils,
      json_to_sheet: jest.fn(),
    },
  };
});

global.alert = jest.fn();

class MockDataTransferItem {
  kind = "file";
  type = "";
  constructor(public file: File) {}
  getAsFile() {
    return this.file;
  }
}

class MockDataTransfer {
  items: MockDataTransferItem[] = [];

  add(item: File) {
    this.items.push(new MockDataTransferItem(item));
  }
}

(global as any).DataTransfer = MockDataTransfer;

const renderUploadRatesModal = () => {
  const mockOnClose = jest.fn();
  const mockOnUploadComplete = jest.fn();
  return render(
    <UploadRatesModal
      open={true}
      onClose={mockOnClose}
      onUploadComplete={mockOnUploadComplete}
      selectedValues={{
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
      }}
    />
  );
};

describe("UploadRatesModal", () => {
  const mockOnClose = jest.fn();
  const mockOnUploadComplete = jest.fn();
  let mockAxios;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it("renders without errors", () => {
    const { container } = renderUploadRatesModal();
    expect(container).toBeInTheDocument();
  });

  it("displays the correct title", () => {
    const { getByText } = renderUploadRatesModal();
    const title = getByText("Bulk Upload Rates");
    expect(title).toBeInTheDocument();
  });

  it("displays the 'Download template' link", () => {
    const { getByText } = renderUploadRatesModal();
    const downloadLink = getByText("Use our template to import your rates data.");
    expect(downloadLink).toBeInTheDocument();
  });

  it("displays the 'Drag and drop file here' message", () => {
    const { getByText } = renderUploadRatesModal();
    const dragAndDropMessage = getByText("Drag and drop file here");
    expect(dragAndDropMessage).toBeInTheDocument();
  });

  it("displays the 'File Types' and 'Max size' information", () => {
    const { getByText } = renderUploadRatesModal();
    const fileTypesInfo = getByText("File Types: XLS, XLSM, XLSX, XML, CSV. Max size: 10 MB");
    expect(fileTypesInfo).toBeInTheDocument();
  });

  it("displays the 'Cancel' and 'Save' buttons", () => {
    const { getByText } = renderUploadRatesModal();
    const cancelButton = getByText("Cancel");
    const saveButton = getByText("Save");
    expect(cancelButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
  });

  it("closes the modal when the close button is clicked", () => {
    const { getByText } = render(
      <UploadRatesModal
        open={true}
        onClose={mockOnClose}
        onUploadComplete={mockOnUploadComplete}
        selectedValues={{
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
        }}
      />
    );
    const closeButton = getByText("×");
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("handleFileChange processes valid files", () => {
    const { getByText } = renderUploadRatesModal();
    const input = getByText(/Click to upload/);
    const validFile = new File(["dummy content"], "dummy.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(input, { target: { files: [validFile] } });
    expect((input as HTMLInputElement).value).toBe("");
  });

  // test("handleFileChange rejects invalid files with an alert", () => {
  //   window.alert = jest.fn();
  //   const { getByTestId } = renderUploadRatesModal();
  //   const input = getByTestId("fileInput");
  //   const invalidFile = new File(["dummy content"], "dummy.txt", { type: "text/plain" });
  //   fireEvent.change(input, { target: { files: [invalidFile] } });
  //   expect(window.alert).toHaveBeenCalledWith(
  //     "Invalid file type. Please upload XLS, XLSM, XLSX, XML, or CSV files only."
  //   );
  //   expect((input as HTMLInputElement).value).toBe("");
  // });

  test("handleClose resets the state and calls onClose", () => {
    const { getByText } = render(
      <UploadRatesModal
        open={true}
        onClose={mockOnClose}
        onUploadComplete={mockOnUploadComplete}
        selectedValues={{
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
        }}
      />
    );
    const closeButton = getByText(/×/);
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onUploadComplete when a valid file is uploaded and saved", async () => {
    mockAxios.onPost("/ratemgmt/rates/ratelist").reply(200, { success: true });
    const { getByTestId, getByText } = render(
      <UploadRatesModal
        open={true}
        onClose={mockOnClose}
        onUploadComplete={mockOnUploadComplete}
        selectedValues={{
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
        }}
      />
    );
    const input = getByTestId("fileInput");
    const validFile = new File(["dummy content"], "dummy.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(input, { target: { files: [validFile] } });
    const saveButton = getByText("Save");
    fireEvent.click(saveButton);
    await waitFor(
      () => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it("resets file input when modal is closed after a file was uploaded", () => {
    const { getByTestId, getByText } = renderUploadRatesModal();
    const input = getByTestId("fileInput");
    const validFile = new File(["dummy content"], "dummy.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(input, { target: { files: [validFile] } });
    const closeButton = getByText("×");
    fireEvent.click(closeButton);
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("removes error message when a valid file is uploaded after a failed Save attempt", () => {
    const { getByTestId, getByText, queryByText } = renderUploadRatesModal();
    const saveButton = getByText("Save");
    fireEvent.click(saveButton);

    const input = getByTestId("fileInput");
    const validFile = new File(["dummy content"], "dummy.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(input, { target: { files: [validFile] } });

    const errorMessage = queryByText("Please upload a valid file before saving.");
    expect(errorMessage).not.toBeInTheDocument();
  });

  it("should trigger file input click when openFileDialog is called", () => {
    const { getByTestId } = render(
      <UploadRatesModal
        open={true}
        onClose={jest.fn()}
        onUploadComplete={jest.fn()}
        selectedValues={{
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
        }}
      />
    );

    const fileInput = document.createElement("input");
    fileInput.id = "fileInput";
    fileInput.type = "file";
    fileInput.click = jest.fn();

    document.body.appendChild(fileInput);

    const uploadContainer = getByTestId("upload-container");

    const input = document.getElementById("fileInput");

    const clickSpy = jest.spyOn(input, "click");

    fireEvent.click(uploadContainer);

    expect(clickSpy).toHaveBeenCalled();

    document.body.removeChild(fileInput);
  });

  it("sets the selected file when a valid file is dropped", () => {
    const { getByText } = renderUploadRatesModal();

    const dropzone = getByText(/Drag and drop file here/i).parentElement;

    const customFile = new File(["dummy content"], "dummy.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const items = [customFile];
    const customDataTransfer = { items, files: items };

    fireEvent.drop(dropzone, {
      dataTransfer: customDataTransfer,
    });

    expect(global.alert).not.toHaveBeenCalled();
  });

  // it("shows an alert when an invalid file is dropped", () => {
  //   const { getByText } = renderUploadRatesModal();
  //   const dropzone = getByText(/Drag and drop file here/i).parentElement;

  //   const file = new File(["dummy content"], "dummy.txt", { type: "text/plain" });

  //   const items = [file];
  //   const dataTransfer = { items, files: items };

  //   fireEvent.drop(dropzone, {
  //     dataTransfer,
  //   });

  //   expect(global.alert).toHaveBeenCalledWith(
  //     "Invalid file type. Please upload XLS, XLSM, XLSX, XML, or CSV files only."
  //   );
  // });

  it("handles drag over event", () => {
    const onCloseMock = jest.fn();
    const onUploadCompleteMock = jest.fn();

    const { getByTestId } = render(
      <UploadRatesModal
        open={true}
        onClose={onCloseMock}
        onUploadComplete={onUploadCompleteMock}
        selectedValues={{
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
        }}
      />
    );

    const uploadContainer = getByTestId("upload-container");

    userEvent.type(uploadContainer, "dragover");

    expect(onCloseMock).not.toHaveBeenCalled();
    expect(onUploadCompleteMock).not.toHaveBeenCalled();
  });

  it("should be setSelectedFile null if deleteFile is clicked", () => {
    const { getByText, getByTestId, queryByText } = renderUploadRatesModal();
    const dropzone = getByText(/Drag and drop file here/i).parentElement;

    const customFile = new File(["dummy content"], "dummy.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const items = [customFile];
    const customDataTransfer = { items, files: items };

    fireEvent.drop(dropzone, {
      dataTransfer: customDataTransfer,
    });

    const deleteFileButton = getByTestId("delete-file-button");
    fireEvent.click(deleteFileButton);

    const fileInput = getByTestId("fileInput") as HTMLInputElement;
    expect(queryByText("dummy.xlsx")).toBeNull();
  });

  // it("should generate the correct payload and row_id for each uploaded rate", async () => {
  //   mockAxios.onPost("/ratemgmt/rates/ratelist").reply(200, { success: true });

  //   const { getByTestId, getByText } = render(
  //     <UploadRatesModal
  //       open={true}
  //       onClose={mockOnClose}
  //       onUploadComplete={mockOnUploadComplete}
  //       selectedValues={{
  //         purchaseCompany: "1003",
  //         expenseType: "527",
  //         expenseParameter: "90",
  //         transportMode: "",
  //         containerType: "",
  //         loadingPort: "",
  //         destinationPort: "",
  //         entryPort: "",
  //         supplier9dvn: "",
  //         agentOffice: "",
  //         port: "",
  //         destination: "",
  //         department: "",
  //         container: "",
  //         country: "",
  //         taxCategory: "",
  //         importCountry: "",
  //         originCountry: "",
  //       }}
  //     />
  //   );

  //   (XLSX.read as jest.MockedFunction<typeof XLSX.read>).mockReturnValue({
  //     SheetNames: ["Sheet1"],
  //     Sheets: {
  //       Sheet1: XLSX.utils.json_to_sheet([
  //         {
  //           "Effective Date": "2022-01-01",
  //           "Termination Date": "2023-01-01",
  //           "Rate Value": 100,
  //           "Currency Code": "USD",
  //           "Rate Type": "Type1",
  //           "UOM Code": "UOM1",
  //           "Update User ID": "User1",
  //         },
  //       ]),
  //     },
  //   });

  //   const ws = XLSX.utils.json_to_sheet([
  //     {
  //       "Effective Date": "2022-01-01",
  //       "Termination Date": "2023-01-01",
  //       "Rate Value": 100,
  //       "Currency Code": "USD",
  //       "Rate Type": "Type1",
  //       "UOM Code": "UOM1",
  //       "Update User ID": "User1",
  //     },
  //   ]);
  //   const wb = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  //   const excelFileContent = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  //   const fileContent = new Uint8Array(excelFileContent);

  //   const file = new File([fileContent], "rates.xlsx", {
  //     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   });
  //   const input = getByTestId("fileInput");

  //   await act(async () => {
  //     fireEvent.change(input, { target: { files: [file] } });
  //   });

  //   console.log("Uploaded Rates:", file);

  //   let saveButton;
  //   await act(async () => {
  //     saveButton = getByText("Save");
  //     fireEvent.click(saveButton);
  //   });

  //   console.log("Uploaded Rates2:", file);

  //   await waitFor(() => {
  //     expect(mockOnUploadComplete).toHaveBeenCalled();
  //     console.log("Payload sended:", mockOnUploadComplete.mock.calls[0][0]);
  //   });

  //   const expectedPayload = [
  //     {
  //       container_type_id: 0,
  //       currency_code: "USD",
  //       effective_date: "2060-12-31",
  //       element_id: 527,
  //       element_subtype_id: 90,
  //       entry_port_id: 0,
  //       loading_port_id: 0,
  //       market_id: 1003,
  //       per_uom_code: "CR",
  //       rate_type: "Amount",
  //       rate_value: 100,
  //       row_id: 1,
  //       termination_date: "2061-01-01",
  //       transport_mode: 0,
  //       update_user_id: "User1",
  //     },
  //   ];

  //   await waitFor(() => {
  //     expect(mockOnUploadComplete).toHaveBeenCalledWith(expectedPayload);
  //   });
  // });
});

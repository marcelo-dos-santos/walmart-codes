import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import ItemID from "../ItemID";
import userEvent from "@testing-library/user-event";
import { filterValues, Options, InputTextProps } from "../../utils/formInterface";

describe("Item ID Component", () => {
  const mockSetInitialValues = jest.fn();
  const mockSetFilter = jest.fn();
  const mockFetchItemDetails = jest.fn();
  const initialValues: {
    market: Options;
    supplier: Options;
    department: Options;
    costValue: string;
  } = {
    market: { label: "Test 1", value: "1001" },
    supplier: { label: "Test 2", value: "1" },
    costValue: "",
    department: { label: "Test 4", value: "92" },
  };
  const filter: { [key: string]: any } = {
    import_freight: {
      transport_mode: 5,
    },
    pack: {
      weight_uom: "KG",
    },
  };

  it("renders correctly", () => {
    const { getByPlaceholderText } = render(
      <ItemID
        initialValues={initialValues}
        setInitialValues={mockSetInitialValues}
        setFilter={mockSetFilter}
        fetchItemDetails={mockFetchItemDetails}
        filter={filter}
      />
    );

    expect(getByPlaceholderText("Item ID")).toBeInTheDocument();
  });

  it("calls setInitialValues with correct value on input change", () => {
    const { getByPlaceholderText } = render(
      <ItemID
        initialValues={initialValues}
        setInitialValues={mockSetInitialValues}
        setFilter={mockSetFilter}
        fetchItemDetails={mockFetchItemDetails}
        filter={filter}
      />
    );

    const input = getByPlaceholderText("Item ID");
    fireEvent.change(input, { target: { value: "123" } });
    expect(mockSetInitialValues).toHaveBeenCalledWith({
      ...initialValues,
      item_id: "123",
    });
  });

  it("calls fetchItemDetails on valid blur", async () => {
    const { getByPlaceholderText } = render(
      <ItemID
        initialValues={initialValues}
        setInitialValues={mockSetInitialValues}
        setFilter={mockSetFilter}
        fetchItemDetails={mockFetchItemDetails}
        filter={filter}
      />
    );

    const input = getByPlaceholderText("Item ID");
    fireEvent.change(input, { target: { value: "123" } });
    fireEvent.blur(input);

    expect(mockSetInitialValues).toHaveBeenCalledWith({
      ...initialValues,
      item_id: "123",
    });
  });
});

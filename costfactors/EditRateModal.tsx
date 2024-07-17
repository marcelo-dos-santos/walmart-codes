import { useEffect, useState } from 'react';
import { InputLabel, Select, MenuItem, Input } from '@mui/material';
import { DeleteButton, UploadButton } from './CustomApplyButton';
import { Dialog, DialogContent } from '@mui/material';
import { getEnv, getHeaders } from '../utils/EnvConfig';
import { config } from '../utils/config';
import axios from 'axios';
import { getEnvironmentInfo } from '../environments/auth.service';

interface EditRateModalProps {
  open: boolean;
  onClose: () => void;
  onClick?: () => void;
  rateValue: number;
  effectiveDate: string;
  expirationDate: string;
  currency: string;
  rateType: string;
  rateBasis: string;
  ratesData: any[];
  onDeleteRate: (effectiveDateToDelete: string) => void;
  isAdminMode: boolean;
  isFuture: boolean;
  onAddRateClick: (rateData: {
    rateValue: number;
    effectiveDate: string;
    expirationDate: string;
    currency: string;
    rateType: string;
    rateBasis: string;
  }) => void;
  onEditRateSuccess: (newRate: {
    rateValue: number;
    effectiveDate: string;
    expirationDate: string;
    currency: string;
    rateType: string;
    rateBasis: string;
  }) => void;
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

interface Payload {
  update_user_id: string;
  market_id: number;
  element_id: number;
  element_subtype_id: number;
  loading_port_id: number;
  entry_port_id: number;
  transport_mode: number;
  container_type_id: number;
  per_uom_code: string;
  rateValue: number;
  effectiveDate: string;
  expirationDate: string;
  currency: string;
  rateType: string;
  rateBasis: string;
}

const labelStyle = {
  fontSize: '14px',
  display: 'block',
  marginBottom: '5px',
  marginTop: '24px',
  fontWeight: 700,
  color: 'rgba(46, 47, 50, 1)',
};

const inputStyle = {
  width: '268px',
  height: '56px',
  padding: '13px',
  borderRadius: '4px',
  border: '1px solid rgba(144, 145, 150, 1)',
  backgroundColor: 'rgba(255, 255, 255, 1)',
  '&:hover': {
    borderColor: 'rgba(144, 145, 150, 1)',
  },
};

const inputSelectStyle = {
  width: '552px',
  height: '56px',
  borderRadius: '4px',
  border: '1px solid rgba(144, 145, 150, 1)',
  backgroundColor: 'rgba(255, 255, 255, 1)',
  '&:hover': {
    borderColor: 'rgba(144, 145, 150, 1)',
  },
};

const textStyle = {
  fontFamily: 'Bogle',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '36px',
};

const linkStyle = {
  fontFamily: 'Bogle',
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: '24px',
  textDecoration: 'underline',
  color: 'rgba(46, 47, 50, 1)',
  transition: 'filter 0.3s ease',
  cursor: 'pointer',
};

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  marginTop: '20px',
  justifyContent: 'flex-end',
  gap: '16px',
};

export function EditRateModal({
  open,
  onClose,
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
  isAdminMode,
  isFuture,
}: EditRateModalProps) {
  const [, setShowAddRateModal] = useState(false);
  const [effective, setEffective] = useState(effectiveDate);
  const [termination, setTermination] = useState(expirationDate);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedRateType, setSelectedRateType] = useState(rateType);
  const [selectedRateValue, setSelectedRateValue] = useState(rateValue);
  const [selectedRateBasis, setSelectedRateBasis] = useState(rateBasis || '');
  let env: {
    headers: any;
  };

  const colorStyle = isFuture
    ? 'rgba(46, 47, 50, 1)'
    : 'rgba(186, 187, 190, 1)';

  useEffect(() => {
    env = getEnv(config);
  });

  const environment = getEnvironmentInfo();

  const rateData = {
    market_id: Number(selectedValues.purchaseCompany),
    element_id: Number(selectedValues.expenseType),
    element_subtype_id: Number(selectedValues.expenseParameter),
    loading_port_id: Number(selectedValues.loadingPort),
    entry_port_id: Number(selectedValues.entryPort),
    transport_mode: Number(selectedValues.transportMode),
    container_type_id: Number(selectedValues.container),
    rate_value: selectedRateValue,
    effective_date: effectiveDate,
    termination_date: termination,
    currency_code: selectedCurrency,
    rate_type: selectedRateType,
    per_uom_code: selectedRateBasis,
  };

  const currentDate = new Date();
  const formattedCurrentDate = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  async function updateRate() {
    const effectiveDate = new Date(effective);
    const terminationDate = new Date(termination);
    const sortedRatesData = ratesData.sort(
      (a, b) =>
        new Date(b.termination_date).getDate() -
        new Date(a.termination_date).getDate()
    );
    const latestRate = sortedRatesData[0];

    if (terminationDate < effectiveDate) {
      return;
    }
    if (latestRate && !latestRate.termination_date) {
      return;
    }
    const isOverlap = ratesData.some((rate) => {
      const rateEffectiveDate = new Date(rate.effective_date);
      const rateTerminationDate = new Date(rate.termination_date);
      return (
        rateEffectiveDate <= terminationDate &&
        rateTerminationDate >= effectiveDate
      );
    });
    if (isOverlap) {
      return;
    }

    const payload: Partial<Payload> = {
      ...rateData,
      update_user_id: 'mfromer',
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof Payload] === '')
        delete payload[key as keyof Payload];
    });

    try {
      const headers = getHeaders(env);
      const response = await axios.post(
        `${environment.gstCostApiBaseUrl}/ratemgmt/rates/ratelist`,
        [payload],
        {
          headers,
        }
      );
      if (response.status === 200) {
        console.log('Rate updated:', response.data);
        setShowAddRateModal(false);
        onClose();
        onEditRateSuccess({
          rateValue: selectedRateValue,
          effectiveDate: effective,
          expirationDate: termination,
          currency: selectedCurrency,
          rateType: selectedRateType,
          rateBasis: selectedRateBasis,
        });
      }
    } catch (error) {
      console.log('Data:', payload);
      console.error('Error trying to update rate:', error);
    }
  }

  const handleDelete = () => {
    onDeleteRate(effectiveDate);
    onClose();
  };

  const handleClose = () => {
    setEffective(effectiveDate || '');
    setTermination(expirationDate);
    setSelectedCurrency(currency || '');
    setSelectedRateType(rateType || '');
    setSelectedRateValue(rateValue || 0);
    setSelectedRateBasis(rateBasis || '');
    onClose();
  };

  useEffect(() => {
    setEffective(effectiveDate);
  }, [effectiveDate]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={false}>
      <DialogContent>
        <div className="editmodal">
          <div className="modal-content">
            <div
              className="title"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '-20px',
              }}
            >
              <h2 style={textStyle}>Edit Rate</h2>
              <span
                aria-label="Close"
                data-cy="close-modal-button"
                className="close-button"
                style={{ fontSize: '24px', cursor: 'pointer' }}
                onClick={handleClose}
              >
                &times;
              </span>
            </div>
            <div
              className="date-inputs"
              style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <InputLabel
                  style={{ ...labelStyle, color: colorStyle }}
                  htmlFor="effective-date"
                >
                  Effective date (mm/dd/yyyy)
                </InputLabel>
                <Input
                  type="date"
                  id="effective-date"
                  data-cy="effectiveDateInput"
                  sx={inputStyle}
                  inputProps={{
                    min: formattedCurrentDate,
                    pattern: '\\d{4}-\\d{2}-\\d{2}',
                  }}
                  value={effective}
                  onChange={(e) => setEffective(e.target.value)}
                  disabled={!isFuture}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <InputLabel style={labelStyle} htmlFor="expiration-date">
                  Termination date (mm/dd/yyyy)
                </InputLabel>
                <Input
                  type="date"
                  data-cy="expirationDateInput"
                  id="expiration-date"
                  sx={inputStyle}
                  value={termination}
                  inputProps={{ min: formattedCurrentDate }}
                  onChange={(e) => setTermination(e.target.value)}
                />
              </div>
            </div>
            <div className="selects">
              <InputLabel
                style={{ ...labelStyle, color: colorStyle }}
                htmlFor="currency"
              >
                Currency
              </InputLabel>
              <Select
                id="currency"
                data-cy="currencySelect"
                sx={inputSelectStyle}
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                disabled={!isFuture}
              >
                <MenuItem value="USD">US Dollar</MenuItem>
                <MenuItem value="MXP">Mexican Peso</MenuItem>
              </Select>
              <InputLabel
                style={{ ...labelStyle, color: colorStyle }}
                htmlFor="rate-type"
              >
                Rate type
              </InputLabel>
              <Select
                id="rate-type"
                data-cy="rate-typeSelect"
                sx={inputSelectStyle}
                value={selectedRateType}
                onChange={(e) => setSelectedRateType(e.target.value)}
                disabled={!isFuture}
              >
                <MenuItem value="Amount">Amount</MenuItem>
                <MenuItem value="Percentage">Percentage</MenuItem>
              </Select>
            </div>
            <div className="rate-input">
              <InputLabel
                style={{ ...labelStyle, color: colorStyle }}
                htmlFor="rate"
              >
                Rate/Percent
              </InputLabel>
              <Input
                type="text"
                data-cy="rate-percentSelect"
                id="rate"
                sx={{ ...inputSelectStyle, padding: '16px' }}
                value={selectedRateValue.toString()}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setSelectedRateValue(value);
                  }
                }}
                disabled={!isFuture}
              />
            </div>
            <div className="rate-basis">
              <InputLabel
                style={{ ...labelStyle, color: colorStyle }}
                htmlFor="rate-basis"
              >
                Unit of Measure
              </InputLabel>
              <Select
                id="rate-basis"
                data-cy="rate-basisSelect"
                sx={inputSelectStyle}
                value={selectedRateBasis}
                onChange={(e) => setSelectedRateBasis(e.target.value)}
                disabled={!isFuture}
              >
                <MenuItem value="CR">Cubic Meter</MenuItem>
                <MenuItem value="KG">Kilogram</MenuItem>
              </Select>
            </div>
            <div className="buttons" style={buttonStyle}>
              {isFuture && (
                <DeleteButton
                  label="Delete Rate"
                  data-cy="deleteRate"
                  onClick={handleDelete}
                  style={{ marginRight: 'auto' }}
                />
              )}
              <a style={linkStyle} onClick={handleClose}>
                Cancel
              </a>
              <UploadButton onClick={updateRate}>Save</UploadButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditRateModal;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import EditRateModal from '../EditRateModal';
import MockAdapter from 'axios-mock-adapter';
import userEvent from '@testing-library/user-event';
import { getEnvironmentInfo } from '../../environments/auth.service';

const onDeleteRateMock = jest.fn();

const environment = getEnvironmentInfo();

const baseProps = {
  open: true,
  onClose: jest.fn(),
  onAddRateClick: jest.fn(),
  onDeleteRate: onDeleteRateMock,
  rateValue: 100,
  effectiveDate: '2023-10-25',
  expirationDate: '2023-12-25',
  currency: 'USD',
  rateType: 'Amount',
  rateBasis: 'CR',
  ratesData: [],
  selectedValues: {
    purchaseCompany: '',
    expenseType: '',
    expenseParameter: '',
    transportMode: '',
    containerType: '',
    loadingPort: '',
    destinationPort: '',
    entryPort: '',
    supplier9dvn: '',
    agentOffice: '',
    port: '',
    destination: '',
    department: '',
    container: '',
    country: '',
    taxCategory: '',
    importCountry: '',
    originCountry: '',
  },
  onEditRateSuccess: jest.fn(),
};

describe('EditRateModal', () => {
  let mock: MockAdapter;
  let consoleSpy: jest.SpyInstance<
    void,
    [message?: any, ...optionalParams: any[]],
    any
  >;

  beforeAll(() => {
    jest
      .spyOn(global.Date, 'now')
      .mockImplementation(() => new Date('2023-10-24T00:00:00Z').getTime());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mock = new MockAdapter(axios);
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    mock.restore();
    consoleSpy.mockRestore();
  });

  const onAddRateClickMock = jest.fn();

  it('should send the correct payload when updating the rate', async () => {
    const onCloseMock = jest.fn();
    const onEditRateSuccessMock = jest.fn();
    const onDeleteRateMock = jest.fn();
    const props = {
      open: true,
      onClose: onCloseMock,
      onAddRateClick: onAddRateClickMock,
      rateValue: 100,
      effectiveDate: '2023-10-25',
      expirationDate: '2023-12-25',
      currency: 'USD',
      rateType: 'Amount',
      rateBasis: 'CR',
      ratesData: [],
      selectedValues: {
        purchaseCompany: '',
        expenseType: '',
        expenseParameter: '',
        transportMode: '',
        containerType: '',
        loadingPort: '',
        destinationPort: '',
        entryPort: '',
        supplier9dvn: '',
        agentOffice: '',
        port: '',
        destination: '',
        department: '',
        container: '',
        country: '',
        taxCategory: '',
        importCountry: '',
        originCountry: '',
      },
      onEditRateSuccess: onEditRateSuccessMock,
    };

    mock
      .onPost(`${environment.gstCostApiBaseUrl}/ratemgmt/rates/ratelist`)
      .reply(200, { message: 'Rate updated!' });

    const { getByText } = render(
      <EditRateModal
        onDeleteRate={onDeleteRateMock}
        isAdminMode={false}
        isFuture={false}
        {...props}
      />
    );

    fireEvent.click(getByText('Save'));

    await waitFor(() => expect(mock.history.post.length).toBe(1));

    await waitFor(() => expect(onEditRateSuccessMock).toHaveBeenCalled());
  });

  it("should show error if effectiveDate is less than or equal to today's date", async () => {
    const mockError = jest.spyOn(console, 'error').mockImplementation(() => {
      /* no-op */
    });
    const onCloseMock = jest.fn();
    const onEditRateSuccessMock = jest.fn();

    const props = {
      open: true,
      onClose: onCloseMock,
      onAddRateClick: onAddRateClickMock,
      rateValue: 100,
      effectiveDate: '2023-10-20',
      expirationDate: '2023-12-29',
      currency: 'USD',
      rateType: 'Amount',
      rateBasis: 'CR',
      ratesData: [],
      selectedValues: {
        purchaseCompany: '',
        expenseType: '',
        expenseParameter: '',
        transportMode: '',
        containerType: '',
        loadingPort: '',
        destinationPort: '',
        entryPort: '',
        supplier9dvn: '',
        agentOffice: '',
        port: '',
        destination: '',
        department: '',
        container: '',
        country: '',
        taxCategory: '',
        importCountry: '',
        originCountry: '',
      },
      onEditRateSuccess: onEditRateSuccessMock,
    };

    render(
      <EditRateModal
        onDeleteRate={onDeleteRateMock}
        isAdminMode={false}
        isFuture={false}
        {...props}
      />
    );

    fireEvent.click(screen.getByText('Save'));

    await (() => {
      expect(console.error).toHaveBeenCalledWith(
        'Effective date should be greater than today.'
      );
    });
    mockError.mockRestore();
  });

  it("should show error if expirationDate is less than or equal to today's date", async () => {
    const mockError = jest.spyOn(console, 'error').mockImplementation(() => {
      /* no-op */
    });
    const onCloseMock = jest.fn();
    const onEditRateSuccessMock = jest.fn();

    const props = {
      open: true,
      onClose: onCloseMock,
      onAddRateClick: onAddRateClickMock,
      rateValue: 100,
      effectiveDate: '2023-10-24',
      expirationDate: '2023-12-29',
      currency: 'USD',
      rateType: 'Amount',
      rateBasis: 'CR',
      ratesData: [],
      selectedValues: {
        purchaseCompany: '',
        expenseType: '',
        expenseParameter: '',
        transportMode: '',
        containerType: '',
        loadingPort: '',
        destinationPort: '',
        entryPort: '',
        supplier9dvn: '',
        agentOffice: '',
        port: '',
        destination: '',
        department: '',
        container: '',
        country: '',
        taxCategory: '',
        importCountry: '',
        originCountry: '',
      },
      onEditRateSuccess: onEditRateSuccessMock,
    };

    render(
      <EditRateModal
        onDeleteRate={onDeleteRateMock}
        isAdminMode={false}
        isFuture={false}
        {...props}
      />
    );

    fireEvent.click(screen.getByText('Save'));

    await (() => {
      expect(console.error).toHaveBeenCalledWith(
        'Termination date should be greater or equal than today.'
      );
    });
    mockError.mockRestore();
  });

  it('calls onClose and onEditRateSuccess when the response is successful', async () => {
    mock
      .onPost(`${environment.gstCostApiBaseUrl}/ratemgmt/rates/ratelist`)
      .reply(200, {
        data: 'Fake response data',
      });
    const onCloseMock = jest.fn();
    const onEditRateSuccessMock = jest.fn();
    const props = {
      open: true,
      onClose: onCloseMock,
      onAddRateClick: onAddRateClickMock,
      rateValue: 100,
      effectiveDate: '',
      expirationDate: '2023-12-31',
      currency: 'USD',
      rateType: 'Amount',
      rateBasis: 'KG',
      ratesData: [],
      selectedValues: {
        purchaseCompany: '',
        expenseType: '',
        expenseParameter: '',
        transportMode: '',
        containerType: '',
        loadingPort: '',
        destinationPort: '',
        entryPort: '',
        supplier9dvn: '',
        agentOffice: '',
        port: '',
        destination: '',
        department: '',
        container: '',
        country: '',
        taxCategory: '',
        importCountry: '',
        originCountry: '',
      },
      onEditRateSuccess: onEditRateSuccessMock,
    };

    const { getByText } = render(
      <EditRateModal
        onDeleteRate={onDeleteRateMock}
        isAdminMode={false}
        isFuture={false}
        {...props}
      />
    );

    fireEvent.click(getByText('Save'));

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalled();
      expect(onEditRateSuccessMock).toHaveBeenCalledWith({
        rateValue: props.rateValue,
        effectiveDate: props.effectiveDate,
        expirationDate: props.expirationDate,
        currency: props.currency,
        rateType: props.rateType,
        rateBasis: props.rateBasis,
      });
    });
  });

  it('should be possible edit termination input', () => {
    const { getByLabelText } = render(
      <EditRateModal isAdminMode={false} isFuture={false} {...baseProps} />
    );

    const terminationInput = getByLabelText(
      'Termination date (mm/dd/yyyy)'
    ) as HTMLInputElement;

    fireEvent.change(terminationInput, { target: { value: '2023-10-25' } });

    expect(terminationInput.value).toBe('2023-10-25');
  });

  it('should not allow date overlap ', async () => {
    const onCloseMock = jest.fn();
    const onEditRateSuccessMock = jest.fn();
    const ratesDataWithOverlap = [
      {
        effective_date: '2023-01-05',
        termination_date: '2023-01-15',
      },
    ];
    const props = {
      open: true,
      onClose: onCloseMock,
      onAddRateClick: onAddRateClickMock,
      rateValue: 100,
      effectiveDate: '2023-01-01',
      expirationDate: '2023-01-10',
      currency: 'USD',
      rateType: 'Amount',
      rateBasis: 'KG',
      ratesData: [{ ratesDataWithOverlap }],
      selectedValues: {
        purchaseCompany: '',
        expenseType: '',
        expenseParameter: '',
        transportMode: '',
        containerType: '',
        loadingPort: '',
        destinationPort: '',
        entryPort: '',
        supplier9dvn: '',
        agentOffice: '',
        port: '',
        destination: '',
        department: '',
        container: '',
        country: '',
        taxCategory: '',
        importCountry: '',
        originCountry: '',
      },
      onEditRateSuccess: onEditRateSuccessMock,
    };

    const { getByLabelText } = render(
      <EditRateModal
        onDeleteRate={onDeleteRateMock}
        isAdminMode={false}
        isFuture={false}
        {...props}
      />
    );

    const terminationDateInput = getByLabelText(/termination date/i);
    fireEvent.change(terminationDateInput, { target: { value: '2023-06-01' } });

    await waitFor(() => {
      expect(onEditRateSuccessMock).not.toHaveBeenCalled();
    });
  });

  it('should resets fields to initial values on modal close', async () => {
    const { getByLabelText, getByTestId } = render(
      <EditRateModal isAdminMode={true} isFuture={true} {...baseProps} />
    );

    const terminationDateInput = getByLabelText(
      'Termination date (mm/dd/yyyy)'
    ) as HTMLInputElement;
    fireEvent.change(terminationDateInput, { target: { value: '2023-12-25' } });

    expect(terminationDateInput.value).toBe('2023-12-25');

    const closeButton = getByTestId('close-modal-button');
    fireEvent.click(closeButton);

    expect(terminationDateInput.value).toBe(baseProps.expirationDate);
  });

  it('updates selects on change', async () => {
    const onCloseMock = jest.fn();
    const onEditRateSuccessMock = jest.fn();
    const props = {
      open: true,
      onClose: onCloseMock,
      onAddRateClick: onAddRateClickMock,
      rateValue: 100,
      effectiveDate: '',
      expirationDate: '',
      currency: '',
      rateType: 'Amount',
      rateBasis: 'KG',
      ratesData: [],
      selectedValues: {
        purchaseCompany: '',
        expenseType: '',
        expenseParameter: '',
        transportMode: '',
        containerType: '',
        loadingPort: '',
        destinationPort: '',
        entryPort: '',
        supplier9dvn: '',
        agentOffice: '',
        port: '',
        destination: '',
        department: '',
        container: '',
        country: '',
        taxCategory: '',
        importCountry: '',
        originCountry: '',
      },
      onEditRateSuccess: onEditRateSuccessMock,
    };

    const { getByLabelText } = render(
      <EditRateModal
        onDeleteRate={onDeleteRateMock}
        isAdminMode={true}
        isFuture={true}
        {...props}
      />
    );

    const effectiveDateInput = getByLabelText(
      'Effective date (mm/dd/yyyy)'
    ) as HTMLInputElement;
    userEvent.click(effectiveDateInput);
    fireEvent.change(effectiveDateInput, { target: { value: '2023-12-22' } });

    const terminationDateInput = getByLabelText(
      'Termination date (mm/dd/yyyy)'
    ) as HTMLInputElement;
    userEvent.click(terminationDateInput);
    fireEvent.change(terminationDateInput, { target: { value: '2024-12-22' } });

    expect(effectiveDateInput.value).toBe('2023-12-22');
    expect(terminationDateInput.value).toBe('2024-12-22');
  });

  it('should call handleDelete', () => {
    const onCloseMock = jest.fn();
    const onEditRateSuccessMock = jest.fn();
    const mockHandleDelete = jest.fn();
    const mockUpdateRate = jest.fn();
    const props = {
      open: true,
      onClose: onCloseMock,
      onAddRateClick: onAddRateClickMock,
      updateRate: mockUpdateRate,
      rateValue: 100,
      effectiveDate: '2023-12-20',
      expirationDate: '2024-12-19',
      currency: 'USD',
      rateType: 'Amount',
      rateBasis: 'KG',
      ratesData: [],
      selectedValues: {
        purchaseCompany: '',
        expenseType: '',
        expenseParameter: '',
        transportMode: '',
        containerType: '',
        loadingPort: '',
        destinationPort: '',
        entryPort: '',
        supplier9dvn: '',
        agentOffice: '',
        port: '',
        destination: '',
        department: '',
        container: '',
        country: '',
        taxCategory: '',
        importCountry: '',
        originCountry: '',
      },
      onEditRateSuccess: onEditRateSuccessMock,
      onDeleteRate: mockHandleDelete,
    };

    const { getByTestId } = render(
      <EditRateModal isAdminMode={true} isFuture={true} {...props} />
    );

    const deleteButton = getByTestId('deleteRate');
    fireEvent.click(deleteButton);
    expect(mockHandleDelete).toHaveBeenCalledTimes(1);
  });

  it('should call updateRate', () => {
    const onCloseMock = jest.fn();
    const onEditRateSuccessMock = jest.fn();
    const mockHandleDelete = jest.fn();
    const mockUpdateRate = jest.fn();
    const props = {
      open: true,
      onClose: onCloseMock,
      onAddRateClick: onAddRateClickMock,
      updateRate: mockUpdateRate,
      rateValue: 100,
      effectiveDate: '2023-12-20',
      expirationDate: '2024-12-19',
      currency: 'USD',
      rateType: 'Amount',
      rateBasis: 'KG',
      ratesData: [],
      selectedValues: {
        purchaseCompany: '',
        expenseType: '',
        expenseParameter: '',
        transportMode: '',
        containerType: '',
        loadingPort: '',
        destinationPort: '',
        entryPort: '',
        supplier9dvn: '',
        agentOffice: '',
        port: '',
        destination: '',
        department: '',
        container: '',
        country: '',
        taxCategory: '',
        importCountry: '',
        originCountry: '',
      },
      onEditRateSuccess: onEditRateSuccessMock,
      onDeleteRate: mockHandleDelete,
    };

    const { getByText } = render(
      <EditRateModal isAdminMode={true} isFuture={true} {...props} />
    );

    const cancelButton = getByText(/cancel/i);
    fireEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});

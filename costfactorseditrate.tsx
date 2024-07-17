import React from 'react';
import CostFilterFormTitle from '../components/CostCalculator/CostFilterFormTitle';
import { Options, supplier } from './formInterface';
import { colorRed, margin } from './constants';
import Select from "react-select";

export interface SupplierProps {
    initialValues: {
      market: Options;
      supplier: Options;
      department: Options;
      costValue: string;
    };
    setInitialValues: any;
    setFilter: any;
}

const Supplier: React.FC<SupplierProps> = ({ initialValues, setFilter, setInitialValues }: SupplierProps) => {
    return (
        <div
            style={{ flexDirection: "column", width: "96%", margin: margin }}
            data-testid="supplier-select-component"
        >
            <label
                style={{ fontSize: "12px", display: "block", marginBottom: "5px" }}
                htmlFor="supplier"
            >
                <CostFilterFormTitle as="h4" size="small" weight={700}>
                    {supplier.label}
                    <span style={{ color: colorRed }}>*</span>
                </CostFilterFormTitle>
            </label>
            <Select
                name="supplier"
                placeholder="Select"
                inputId="supplier"
                classNamePrefix="supplier"
                options={supplier.options}
                value={initialValues.supplier.label ? initialValues.supplier : null}
                onChange={(option) => {
                    setInitialValues({
                        ...initialValues,
                        supplier: option,
                        market: {
                            label: null,
                            value: null,
                        },
                        department: {
                            label: null,
                            value: null,
                        },
                    });
                    if (option.value === '1') {
                        setFilter(() => {
                            return { ["is_domestic"]: true };
                        });
                    } else {
                        setFilter(() => {
                            return { ["is_domestic"]: false };
                        });
                    }
                }}
                styles={{
                    control: (baseStyles) => ({
                        ...baseStyles,
                        fontSize: "14px",
                        border: '1px solid rgb(144, 145, 150)',
                        paddingLeft: '4px',
                        fontFamily: "Bogle"
                    }),
                    menuList: (baseStyles) => ({
                        ...baseStyles,
                        fontSize: "14px",
                        fontFamily: "Bogle"
                    }),
                }}
            />
        </div>
    )
}

export default Supplier;
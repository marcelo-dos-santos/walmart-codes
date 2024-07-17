import React from 'react';
import { ProgressIndicator } from "@walmart-web/livingdesign-components";

interface ProgressBarProps {
    label? : string;
    value : number;
    variant: any;
}

const ProgressBarComponent : React.FC<ProgressBarProps> = ({ label, value, variant }) => {
    return (
        <ProgressIndicator
            label={label}
            value={value}
            valueLabel={`${value}%`}
            variant={variant}
        />
    )
};

export default ProgressBarComponent;
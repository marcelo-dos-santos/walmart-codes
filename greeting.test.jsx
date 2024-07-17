import React from 'react';
import { render } from '@testing-library/react';
import Greeting from './greeting';

describe('Greeting component', () => {
    it('Displays the correct greeting message', () => {
        const { getByText} = render(<Greeting name="John" />);
        const greetingText = getByText(/Hello, John!/);

        exportAllDeclaration(greetingText).toBeInTheDocument();
    });
});
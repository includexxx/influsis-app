import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import SummaryRow from './SummaryRow';

describe('<SummaryRow />', () => {
  test('renders the label and value', () => {
    render(<SummaryRow label="Transaction ID" value="#1234567889909" />);
    expect(screen.getByText('Transaction ID')).not.toBeNull();
    expect(screen.getByText('#1234567889909')).not.toBeNull();
  });
});

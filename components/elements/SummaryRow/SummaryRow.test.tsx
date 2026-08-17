import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import SummaryRow from './SummaryRow';

describe('<SummaryRow />', () => {
  test('renders the label and value', () => {
    render(<SummaryRow label="Transaction ID" value="#1234567889909" />);
    expect(screen.getByText('Transaction ID')).not.toBeNull();
    expect(screen.getByText('#1234567889909')).not.toBeNull();
  });

  test('has no card fill in the default plain variant', () => {
    render(<SummaryRow label="Date & Time" value="Oct 12" testID="row" />);
    const style = StyleSheet.flatten(screen.getByTestId('row').props.style);
    expect(style.backgroundColor).toBeUndefined();
  });

  test('adds the card fill in the filled variant', () => {
    render(<SummaryRow label="Withdraw amount" value="$750" variant="filled" testID="row" />);
    const style = StyleSheet.flatten(screen.getByTestId('row').props.style);
    expect(style.backgroundColor).toBe('#EFEFEF');
  });
});

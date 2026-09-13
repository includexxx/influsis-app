import { test, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AccordionItem from './AccordionItem';

describe('<AccordionItem />', () => {
  test('renders the question but not the answer when collapsed', () => {
    render(
      <AccordionItem
        question="Is the app free?"
        answer="Yes, completely free."
        expanded={false}
        onToggle={jest.fn()}
      />,
    );
    expect(screen.getByText('Is the app free?')).not.toBeNull();
    expect(screen.queryByText('Yes, completely free.')).toBeNull();
  });

  test('renders the answer when expanded', () => {
    render(
      <AccordionItem
        question="Is the app free?"
        answer="Yes, completely free."
        expanded
        onToggle={jest.fn()}
      />,
    );
    expect(screen.getByText('Yes, completely free.')).not.toBeNull();
  });

  test('calls onToggle when the question is tapped', () => {
    const onToggle = jest.fn();
    render(
      <AccordionItem
        question="Is the app free?"
        answer="Yes, completely free."
        expanded={false}
        onToggle={onToggle}
        testID="faq-item"
      />,
    );
    fireEvent.press(screen.getByTestId('faq-item'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

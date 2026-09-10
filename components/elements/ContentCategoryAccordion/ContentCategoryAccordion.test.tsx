import { test, expect, jest } from '@jest/globals';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ContentCategoryAccordion from './ContentCategoryAccordion';

const subs = [
  { value: 'singing', label: 'Singing' },
  { value: 'covers', label: 'Covers' },
];

function renderAccordion(
  props: Partial<React.ComponentProps<typeof ContentCategoryAccordion>> = {},
) {
  const handlers = {
    onToggleSelected: jest.fn(),
    onToggleExpanded: jest.fn(),
    onToggleSubcategory: jest.fn(),
  };
  render(
    <ContentCategoryAccordion
      label="Music"
      selected={false}
      expanded={false}
      subcategoryOptions={subs}
      selectedSubcategories={[]}
      testID="cat-music"
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe('<ContentCategoryAccordion />', () => {
  test('hides the subcategory body until selected and expanded', () => {
    const { rerender } = render(
      <ContentCategoryAccordion
        label="Music"
        selected={false}
        expanded
        subcategoryOptions={subs}
        onToggleSelected={jest.fn()}
        onToggleExpanded={jest.fn()}
        onToggleSubcategory={jest.fn()}
      />,
    );
    expect(screen.queryByText('Singing')).toBeNull();

    rerender(
      <ContentCategoryAccordion
        label="Music"
        selected
        expanded
        subcategoryOptions={subs}
        onToggleSelected={jest.fn()}
        onToggleExpanded={jest.fn()}
        onToggleSubcategory={jest.fn()}
      />,
    );
    expect(screen.getByText('Singing')).not.toBeNull();
  });

  test('the checkbox toggles selection and the header toggles expansion', () => {
    const handlers = renderAccordion();
    fireEvent.press(screen.getByTestId('cat-music-checkbox'));
    expect(handlers.onToggleSelected).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId('cat-music-header'));
    expect(handlers.onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  test('a subcategory press reports its value', () => {
    const handlers = renderAccordion({ selected: true, expanded: true });
    fireEvent.press(screen.getByTestId('cat-music-sub-covers'));
    expect(handlers.onToggleSubcategory).toHaveBeenCalledWith('covers');
  });

  test('children replace the generated checklist', () => {
    renderAccordion({
      selected: true,
      expanded: true,
      children: <Text>specify field</Text>,
    });
    expect(screen.getByText('specify field')).not.toBeNull();
    expect(screen.queryByText('Singing')).toBeNull();
  });

  test('the error shows only while selected and expanded', () => {
    const { rerender } = render(
      <ContentCategoryAccordion
        label="Music"
        selected
        expanded={false}
        subcategoryOptions={subs}
        error="Pick at least one subcategory"
        onToggleSelected={jest.fn()}
        onToggleExpanded={jest.fn()}
        onToggleSubcategory={jest.fn()}
      />,
    );
    expect(screen.queryByText('Pick at least one subcategory')).toBeNull();

    rerender(
      <ContentCategoryAccordion
        label="Music"
        selected
        expanded
        subcategoryOptions={subs}
        error="Pick at least one subcategory"
        onToggleSelected={jest.fn()}
        onToggleExpanded={jest.fn()}
        onToggleSubcategory={jest.fn()}
      />,
    );
    expect(screen.getByText('Pick at least one subcategory')).not.toBeNull();
  });
});

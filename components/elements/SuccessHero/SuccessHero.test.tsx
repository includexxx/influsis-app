import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import SuccessHero from './SuccessHero';

describe('<SuccessHero />', () => {
  test('renders the title and description', () => {
    render(
      <SuccessHero
        title="Withdraw money successfully"
        description="Your withdraw has been processed"
      />,
    );
    expect(screen.getByText('Withdraw money successfully')).not.toBeNull();
    expect(screen.getByText('Your withdraw has been processed')).not.toBeNull();
  });

  test('renders without a description', () => {
    render(<SuccessHero title="Withdraw money successfully" />);
    expect(screen.queryByText('Your withdraw has been processed')).toBeNull();
  });
});

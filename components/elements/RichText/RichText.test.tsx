import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import RichText from './RichText';

describe('<RichText />', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders formatted text from the allowlisted tags', () => {
    render(
      <RichText
        html="<p>Show the <strong>box</strong>, <em>slowly</em>, <u>clearly</u> and <s>not</s> fast</p>"
        testID="rich"
      />,
    );
    expect(screen.getByText('Show the box, slowly, clearly and not fast')).not.toBeNull();
    expect(screen.getByText('box')).not.toBeNull();
  });

  test('renders headings, paragraphs and quotes as separate blocks', () => {
    render(<RichText html="<h3>Brief</h3><p>One</p><blockquote><p>Quoted</p></blockquote>" />);
    expect(screen.getByText('Brief')).not.toBeNull();
    expect(screen.getByText('One')).not.toBeNull();
    expect(screen.getByText('Quoted')).not.toBeNull();
  });

  test('drops script and style with their content', () => {
    render(<RichText html="<p>Safe</p><script>alert(1)</script><style>p{}</style>" />);
    expect(screen.getByText('Safe')).not.toBeNull();
    expect(screen.queryByText(/alert/)).toBeNull();
    expect(screen.queryByText(/p\{\}/)).toBeNull();
  });

  test('renders nothing for markup with no visible text', () => {
    const { toJSON } = render(<RichText html="<script>alert(1)</script>" testID="rich" />);
    expect(toJSON()).toBeNull();
    expect(screen.queryByTestId('rich')).toBeNull();
  });

  test('renders nothing for empty input', () => {
    expect(render(<RichText html={null} />).toJSON()).toBeNull();
    expect(render(<RichText html="   " />).toJSON()).toBeNull();
  });

  test('unwraps unknown tags to their text and ignores their attributes', () => {
    render(
      <RichText html={'<p><img src="x" onerror="alert(1)">Hi <span class="x">there</span></p>'} />,
    );
    expect(screen.getByText('Hi there')).not.toBeNull();
    expect(screen.queryByText(/onerror|alert/)).toBeNull();
  });

  test('decodes entities and renders tags written as text literally', () => {
    // A JS string: JSX string attributes would decode the entities themselves.
    render(<RichText html={'<p>Tom &amp; Jerry &lt;b&gt;</p>'} />);
    expect(screen.getByText('Tom & Jerry <b>')).not.toBeNull();
  });

  test('opens an https link', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    render(<RichText html={'<p>See <a href="https://example.com/brief">the brief</a></p>'} />);
    fireEvent.press(screen.getByRole('link'));
    expect(openURL).toHaveBeenCalledWith('https://example.com/brief');
  });

  test('does not link javascript:, data: or entity-encoded javascript: hrefs', () => {
    render(
      <RichText
        html={
          '<p><a href="javascript:alert(1)">one</a> <a href="data:text/html,x">two</a> ' +
          '<a href="java&#x73;cript:alert(1)">three</a> <a>four</a></p>'
        }
      />,
    );
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText('one two three four')).not.toBeNull();
  });

  test('renders bullet and numbered lists, including nested ones', () => {
    render(
      <RichText html="<ul><li>First</li><li>Second<ol><li>Inner</li></ol></li></ul><ol><li>Step</li></ol>" />,
    );
    expect(screen.getByText('First')).not.toBeNull();
    expect(screen.getByText('Second')).not.toBeNull();
    expect(screen.getByText('Inner')).not.toBeNull();
    expect(screen.getByText('Step')).not.toBeNull();
    expect(screen.getAllByText('•')).toHaveLength(2);
    expect(screen.getAllByText('1.')).toHaveLength(2);
  });

  test('turns br into a line break', () => {
    render(<RichText html="<p>Line one<br>Line two</p>" />);
    expect(screen.getByText('Line one\nLine two')).not.toBeNull();
  });
});

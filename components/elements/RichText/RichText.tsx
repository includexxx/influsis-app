import { ReactNode, useMemo } from 'react';
import { Linking, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { parseDocument } from 'htmlparser2';

import { useTheme } from '@/hooks';
import { palette } from '@/theme';

export interface RichTextProps {
  /** Rich-text HTML, e.g. a custom deliverable's server-sanitized description. */
  html: string | null | undefined;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

type DomNode = ReturnType<typeof parseDocument>['children'][number];
type DomElement = Extract<DomNode, { attribs: Record<string, string> }>;

// The backend's rich-text allowlist (18q, `rich-text.ts`). Anything else is
// unwrapped to its text; `script`/`style` are dropped with their content.
const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 'u', 's', 'a', 'br']);
const BLOCK_TAGS = new Set(['p', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote']);

const styles = StyleSheet.create({
  root: { gap: 8 },
  body: { fontSize: 14, lineHeight: 21 },
  h3: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  h4: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  strike: { textDecorationLine: 'line-through' },
  link: { textDecorationLine: 'underline', color: palette.primary[500] },
  list: { gap: 4 },
  listRow: { flexDirection: 'row', gap: 8 },
  listMarker: { minWidth: 14 },
  listBody: { flex: 1, gap: 4 },
  quote: { borderLeftWidth: 3, paddingLeft: 12, gap: 8 },
});

// Only an absolute http(s) URL becomes a link. The parser has already
// decoded entities, so an encoded `javascript:` can't slip through.
function safeHref(href: string | undefined): string | null {
  const value = href?.trim();
  return value && /^https?:\/\/\S+$/i.test(value) ? value : null;
}

function isElement(node: DomNode): node is DomElement {
  return node.type === 'tag';
}

// Keeps text and allowlisted tags. Unknown tags are replaced by their own
// (normalized) children; script, style, comments and directives are dropped
// (htmlparser2 types script/style nodes as 'script'/'style', not 'tag').
function normalize(nodes: readonly DomNode[]): DomNode[] {
  return nodes.flatMap(node => {
    if (node.type === 'text') return [node];
    if (!isElement(node)) return [];
    if (INLINE_TAGS.has(node.name) || BLOCK_TAGS.has(node.name)) return [node];
    return normalize(node.children as DomNode[]);
  });
}

const collapse = (text: string) => text.replace(/\s+/g, ' ');

function isBlank(nodes: readonly DomNode[]): boolean {
  return nodes.every(node => node.type === 'text' && !node.data.trim());
}

// Backend 18q - renders a custom deliverable's rich-text description as
// React Native text. The server sanitizes before storing; this walk is the
// client-side second pass the contract asks for: it emits only native nodes
// for the allowlisted tags and never hands HTML to a WebView or the DOM.
function RichText({ html, color, style, testID }: RichTextProps) {
  const { colors } = useTheme();
  const textColor = color ?? colors.text.primary;
  const nodes = useMemo(
    () => (html?.trim() ? normalize(parseDocument(html).children as DomNode[]) : []),
    [html],
  );

  function renderInline(children: readonly DomNode[], key: string): ReactNode[] {
    return normalize(children).map((node, index) => {
      const childKey = `${key}.${index}`;
      if (node.type === 'text') return collapse(node.data);
      if (!isElement(node)) return null;
      const inner = renderInline(node.children as DomNode[], childKey);
      switch (node.name) {
        case 'br':
          return '\n';
        case 'strong':
        case 'b':
          return (
            <Text key={childKey} style={styles.bold}>
              {inner}
            </Text>
          );
        case 'em':
        case 'i':
          return (
            <Text key={childKey} style={styles.italic}>
              {inner}
            </Text>
          );
        case 'u':
          return (
            <Text key={childKey} style={styles.underline}>
              {inner}
            </Text>
          );
        case 's':
          return (
            <Text key={childKey} style={styles.strike}>
              {inner}
            </Text>
          );
        case 'a': {
          const href = safeHref(node.attribs.href);
          return href ? (
            <Text
              key={childKey}
              accessibilityRole="link"
              onPress={() => Linking.openURL(href)}
              style={styles.link}>
              {inner}
            </Text>
          ) : (
            <Text key={childKey}>{inner}</Text>
          );
        }
        default:
          // A block tag nested inside inline text (malformed markup): keep its text.
          return <Text key={childKey}>{inner}</Text>;
      }
    });
  }

  function paragraph(inline: DomNode[], key: string, textStyle: StyleProp<TextStyle>) {
    if (isBlank(inline)) return null;
    const first = inline[0];
    const last = inline[inline.length - 1];
    const trimmed = inline.map(node => {
      if (node.type !== 'text') return node;
      let data = node.data;
      if (node === first) data = data.replace(/^\s+/, '');
      if (node === last) data = data.replace(/\s+$/, '');
      return { ...node, data } as DomNode;
    });
    return (
      <Text key={key} style={[styles.body, { color: textColor }, textStyle]}>
        {renderInline(trimmed, key)}
      </Text>
    );
  }

  function renderBlocks(
    children: readonly DomNode[],
    key: string,
    textStyle?: StyleProp<TextStyle>,
  ): ReactNode[] {
    const out: ReactNode[] = [];
    let inline: DomNode[] = [];
    const flush = () => {
      if (inline.length) out.push(paragraph(inline, `${key}.t${out.length}`, textStyle));
      inline = [];
    };

    normalize(children).forEach((node, index) => {
      if (!isElement(node) || INLINE_TAGS.has(node.name)) {
        inline.push(node);
        return;
      }
      flush();
      const childKey = `${key}.${index}`;
      const grandChildren = node.children as DomNode[];
      switch (node.name) {
        case 'p':
          out.push(...renderBlocks(grandChildren, childKey, textStyle));
          break;
        case 'h3':
        case 'h4':
          out.push(...renderBlocks(grandChildren, childKey, styles[node.name]));
          break;
        case 'ul':
        case 'ol': {
          const items = normalize(grandChildren).filter(item => !isBlank([item]));
          out.push(
            <View key={childKey} style={styles.list}>
              {items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.listRow}>
                  <Text style={[styles.body, styles.listMarker, { color: textColor }]}>
                    {node.name === 'ol' ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <View style={styles.listBody}>
                    {renderBlocks(
                      isElement(item) && item.name === 'li' ? (item.children as DomNode[]) : [item],
                      `${childKey}.${itemIndex}`,
                      textStyle,
                    )}
                  </View>
                </View>
              ))}
            </View>,
          );
          break;
        }
        case 'blockquote':
          out.push(
            <View key={childKey} style={[styles.quote, { borderLeftColor: colors.border }]}>
              {renderBlocks(grandChildren, childKey, textStyle)}
            </View>,
          );
          break;
        default:
          // `li` outside a list.
          out.push(...renderBlocks(grandChildren, childKey, textStyle));
      }
    });
    flush();
    return out.filter(Boolean);
  }

  const blocks = renderBlocks(nodes, 'rt');
  if (!blocks.length) return null;

  return (
    <View style={[styles.root, style]} testID={testID}>
      {blocks}
    </View>
  );
}

export default RichText;

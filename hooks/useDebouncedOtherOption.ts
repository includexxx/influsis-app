import { useEffect, useRef, useState } from 'react';
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { Dispatch } from '@/utils/store';

const DEFAULT_DEBOUNCE_MS = 400;

// Powers a SelectableListItem "Others" row (content categories, social
// media, ...): the caller swaps that row for a TextField while `showInput`
// is true, and after `delay`ms of no typing this commits the trimmed value
// into a Redux string-list slice via `toggleAction` - the same action the
// preset options use to toggle themselves in/out of that list. Editing the
// text swaps the previously-committed value out for the new one instead of
// accumulating one entry per keystroke pause.
export function useDebouncedOtherOption(
  dispatch: Dispatch,
  toggleAction: ActionCreatorWithPayload<string>,
  delay: number = DEFAULT_DEBOUNCE_MS,
) {
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  const committedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showInput) return undefined;

    const timer = setTimeout(() => {
      const value = text.trim();
      if (value === committedRef.current) return;
      if (committedRef.current) dispatch(toggleAction(committedRef.current));
      if (value) dispatch(toggleAction(value));
      committedRef.current = value || null;
    }, delay);

    return () => clearTimeout(timer);
  }, [text, showInput, dispatch, toggleAction, delay]);

  return { showInput, setShowInput, text, setText };
}

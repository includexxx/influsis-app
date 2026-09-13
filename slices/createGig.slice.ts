import { useDispatch, useSelector } from 'react-redux';
import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch } from '@/utils/store';
import { GigListItem, CreateGigStatus } from '@/types/createGig';

export interface CreateGigState {
  coverImageUri?: string;
  title: string;
  category?: string;
  description: string;
  price: string;
  deliveryTime: string;
  features: GigListItem[];
  requirements: GigListItem[];
  status: CreateGigStatus;
  id?: string;
}

function makeItem(text = ''): GigListItem {
  return { id: nanoid(), text, included: false };
}

// Figma's "What's Included" list starts with 3 empty rows (node 6301:8073)
// and "Requirements for buyers" starts with 1 (node 6301:8093) - matched
// here rather than starting both empty, so a fresh Create Gig visit looks
// like the design instead of a blank list plus an "Add feature" tap away.
function initialFeatures(): GigListItem[] {
  return [makeItem(), makeItem(), makeItem()];
}
function initialRequirements(): GigListItem[] {
  return [makeItem()];
}

function initialState(): CreateGigState {
  return {
    coverImageUri: undefined,
    title: '',
    category: undefined,
    description: '',
    price: '',
    deliveryTime: '',
    features: initialFeatures(),
    requirements: initialRequirements(),
    status: 'draft',
    id: undefined,
  };
}

function updateItem(list: GigListItem[], id: string, changes: Partial<GigListItem>): GigListItem[] {
  return list.map(item => (item.id === id ? { ...item, ...changes } : item));
}

const slice = createSlice({
  name: 'createGig',
  initialState: initialState(),
  reducers: {
    setCoverImageUri: (state, { payload }: PayloadAction<string>) => {
      state.coverImageUri = payload;
    },
    setTitle: (state, { payload }: PayloadAction<string>) => {
      state.title = payload;
    },
    setCategory: (state, { payload }: PayloadAction<string>) => {
      state.category = payload;
    },
    setDescription: (state, { payload }: PayloadAction<string>) => {
      state.description = payload;
    },
    setPrice: (state, { payload }: PayloadAction<string>) => {
      state.price = payload;
    },
    setDeliveryTime: (state, { payload }: PayloadAction<string>) => {
      state.deliveryTime = payload;
    },
    addFeature: state => {
      state.features.push(makeItem());
    },
    updateFeatureText: (state, { payload }: PayloadAction<{ id: string; text: string }>) => {
      state.features = updateItem(state.features, payload.id, { text: payload.text });
    },
    toggleFeatureIncluded: (state, { payload }: PayloadAction<string>) => {
      const item = state.features.find(feature => feature.id === payload);
      if (item) item.included = !item.included;
    },
    removeFeature: (state, { payload }: PayloadAction<string>) => {
      state.features = state.features.filter(feature => feature.id !== payload);
    },
    addRequirement: state => {
      state.requirements.push(makeItem());
    },
    updateRequirementText: (state, { payload }: PayloadAction<{ id: string; text: string }>) => {
      state.requirements = updateItem(state.requirements, payload.id, { text: payload.text });
    },
    removeRequirement: (state, { payload }: PayloadAction<string>) => {
      state.requirements = state.requirements.filter(requirement => requirement.id !== payload);
    },
    // Marks the draft as submitted (Figma "Congratulation" popup, node
    // 6301:7987) and assigns it an id so the preview screen can key off
    // `status === 'pending'` to switch into its read-only view (node
    // 6549:5925) instead of routing to a second screen - see
    // `scenes/main/CreateGigPreview.tsx`.
    submit: state => {
      state.status = 'pending';
      state.id = nanoid();
    },
    reset: () => initialState(),
  },
});

export function useCreateGigSlice() {
  const dispatch = useDispatch<Dispatch>();
  const state = useSelector(({ createGig }: State) => createGig);
  return { dispatch, ...state, ...slice.actions };
}

export default slice.reducer;

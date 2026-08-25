export interface Faq {
  question: string;
  answer: string;
}

// Mock content for the Help Center screen (scenes/main/HelpCenter.tsx,
// Figma "Help Center", node 6027:8303). Figma's own answer copy is literal
// "Lorem ipsum dolor sit amet..." placeholder text on every item, and its
// 6th question is the unfinished placeholder title "Question" - real copy
// was written for both instead, matching this project's practice of
// replacing designer filler with genuine copy (e.g. Apply Campaign's
// success popup, docs/screen/apply-campaign/README.md "Scope notes")
// rather than preserving Lorem Ipsum. The first 5 questions keep Figma's
// own titles verbatim; the 6th ("How do I apply to a campaign?") is new,
// chosen to round out the set with this app's actual apply flow.
export const faqs: Faq[] = [
  {
    question: 'How influsis Works?',
    answer:
      'Influsis connects creators with businesses running creator marketing campaigns. Browse campaigns and gigs on the Home tab, apply to the ones that fit, and message businesses directly once you’re in touch.',
  },
  {
    question: 'Is the influsis App free?',
    answer:
      'Yes. Creating a profile, browsing campaigns and gigs, and applying to campaigns are all free - there’s no charge to use the app.',
  },
  {
    question: 'How can I use influsis',
    answer:
      'Complete your profile, then explore campaigns and gigs from the Home tab. Apply to campaigns that match your niche, publish your own gigs from the Create Gig tab, and keep track of conversations in Message.',
  },
  {
    question: 'How can I log out from influsis?',
    answer: 'Open the Profile tab and tap Logout at the bottom of the Account screen.',
  },
  {
    question: 'How to close influsis account?',
    answer:
      'Account deletion isn’t self-serve yet. Reach out through this Help Center and our support team will take care of it for you.',
  },
  {
    question: 'How do I apply to a campaign?',
    answer:
      'Open any campaign’s details and tap Apply Now. Add a couple of portfolio files and a link to your work, then submit - the business will follow up if you’re a good fit.',
  },
];

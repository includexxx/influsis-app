export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: PasswordStrengthScore;
  /** "" for an empty password, else "Weak" / "Fair" / "Good" / "Strong". */
  label: string;
}

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const;

// A quick, client-side read of how guessable a new password is, for the
// sign-up meter only - the backend's rule is just "at least 8 characters".
// One point each for: 8+ characters, mixed case, a digit, a symbol. Under 8
// characters it never rates above "Weak", since the backend rejects it.
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: LABELS[0] };
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const met = checks.filter(Boolean).length;
  const score = (password.length < 8 ? 1 : Math.max(1, met)) as PasswordStrengthScore;
  return { score, label: LABELS[score] };
}

export function isNhsEmail(email?: string | null) {
  return !!email && email.toLowerCase().endsWith('@nhs.net');
}

export const NHS_ONLY_MESSAGE =
  'Sorry — this app is only available to @nhs.net email addresses.';

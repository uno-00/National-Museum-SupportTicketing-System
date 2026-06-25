/** Standard REQUEST DETAILS → Type options on the TA form. */
export const TA_SERVICE_TYPE_OPTIONS = [
  "Information System",
  "Website Update",
  "Event Assistance",
  "Network/Hardware Troubleshooting",
  "Software Troubleshooting",
  "Others",
] as const;

export function parseCommaSeparatedOptions(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Fix options saved as one comma-separated string instead of an array. */
export function normalizeChoiceFieldOptions(options: string[] | undefined): string[] {
  const raw = options ?? [];
  if (raw.length === 1 && raw[0].includes(",")) {
    return parseCommaSeparatedOptions(raw[0]);
  }
  return [...raw];
}

export function taServiceTypesPlaceholder(): string {
  return TA_SERVICE_TYPE_OPTIONS.join(", ");
}

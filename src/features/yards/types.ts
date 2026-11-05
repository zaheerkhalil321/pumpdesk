export interface YardItem {
  id: string;
  name: string;
  /** The full address, as Google reads it. */
  address: string;
  isActive: boolean;
}

/** A yard in a dropdown. */
export interface YardOption {
  value: string;
  label: string;
}

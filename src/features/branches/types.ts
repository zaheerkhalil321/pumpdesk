/** A branch as Settings > Branches shows it. */
export interface BranchItem {
  id: string;
  name: string;
  code: string;
  streetAddress: string;
  city: string;
  /** Two-letter code, e.g. "ME". */
  state: string;
  zipCode: string;
  /** Shown as (207) 555-0100. */
  phone: string;
  isHq: boolean;
  isActive: boolean;
  /** Active pumps that belong to this branch. */
  pumpCount: number;
}

/** The company and its active branches, for the switcher at the top of the sidebar. */
export interface Workspace {
  companyName: string;
  /** Up to 2 letters for the badge when there is no logo. */
  monogram: string;
  branches: { id: string; name: string; code: string; place: string; isHq: boolean }[];
}

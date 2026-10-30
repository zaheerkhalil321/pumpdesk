export interface SupplierItem {
  id: string;
  name: string;
  /** Shown as (207) 555-0101. Empty when none is saved. */
  phone: string;
  email: string;
  isActive: boolean;
}

/** What an order form needs to offer a supplier. */
export interface OrderFormSupplier {
  id: string;
  name: string;
  phone: string;
}

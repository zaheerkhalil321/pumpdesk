import type { Dispatch, SetStateAction } from "react";

import type {
  Customer,
  CustomerFormData,
} from "../types";

import { TabsContent } from "@/components/ui/tabs";

import { formatDate } from "@/lib/date";

import { CustomerDangerZone } from "@/features/customers/components/CustomerDangerZone";
import { CardSection } from "@/components/common/forms/CardSection";
import { EditableCheckbox } from "@/components/common/forms/EditableCheckbox";
import { EditableField } from "@/components/common/forms/EditableField";

type Props = {
  customer: Customer;
  editing: boolean;
  form: CustomerFormData;
  setForm: Dispatch<SetStateAction<CustomerFormData>>;
};

export function CustomerOverviewTab({
  customer,
  editing,
  form,
  setForm,
}: Props) {
  return (
    <TabsContent value="overview">
      <div className="grid gap-6 xl:grid-cols-3">
        <CardSection title="Company Information">
          <div className="space-y-5">
            <EditableField
              label="Company Name"
              editing={editing}
              value={form.name}
              maxLength={100}
              displayValue={customer.name}
              onChange={(name) =>
                setForm((previous) => ({
                  ...previous,
                  name,
                }))
              }
            />

            <EditableField
              label="Email Address"
              maxLength={254}
              editing={editing}
              value={form.emails[0] ?? ""}
              displayValue={customer.emails.join(", ")}
              onChange={(email) =>
                setForm((previous) => ({
                  ...previous,
                  emails: email ? [email] : [],
                }))
              }
            />

            <EditableField
              label="Phone"
              maxLength={25}
              editing={editing}
              value={form.office_phone}
              displayValue={customer.office_phone ?? ""}
              onChange={(office_phone) =>
                setForm((previous) => ({
                  ...previous,
                  office_phone,
                }))
              }
            />

            <div>
              <div className="text-sm text-muted-foreground">
                Created
              </div>

              <div className="mt-1">
                {formatDate(customer.created_at)}
              </div>
            </div>
          </div>
        </CardSection>

        <CardSection title="Address">
          <div className="space-y-5">
            <EditableField
              label="Address 1"
              maxLength={100}
              editing={editing}
              value={form.address_1}
              displayValue={customer.address_1 ?? ""}
              onChange={(address_1) =>
                setForm((previous) => ({
                  ...previous,
                  address_1,
                }))
              }
            />

            <EditableField
              label="Address 2"
              maxLength={100}
              editing={editing}
              value={form.address_2}
              displayValue={customer.address_2 ?? ""}
              onChange={(address_2) =>
                setForm((previous) => ({
                  ...previous,
                  address_2,
                }))
              }
            />

            <EditableField
              label="City"
              editing={editing}
              maxLength={100}
              value={form.city}
              displayValue={customer.city ?? ""}
              onChange={(city) =>
                setForm((previous) => ({
                  ...previous,
                  city,
                }))
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="State"
                editing={editing}
                maxLength={100}
                value={form.state}
                displayValue={customer.state ?? ""}
                onChange={(state) =>
                  setForm((previous) => ({
                    ...previous,
                    state,
                  }))
                }
              />

              <EditableField
                label="ZIP"
                editing={editing}
                maxLength={20}
                value={form.zip}
                displayValue={customer.zip ?? ""}
                onChange={(zip) =>
                  setForm((previous) => ({
                    ...previous,
                    zip,
                  }))
                }
              />
            </div>
          </div>
        </CardSection>

        <CardSection title="Payment Settings">
          <EditableCheckbox
            label="Require Purchase Order"
            editing={editing}
            checked={form.require_po}
            onChange={(require_po) =>
              setForm((previous) => ({
                ...previous,
                require_po,
              }))
            }
          />
        </CardSection>
      </div>

      <CustomerDangerZone customer={customer} />
    </TabsContent>
  );
}
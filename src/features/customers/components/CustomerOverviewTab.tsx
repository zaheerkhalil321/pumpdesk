import type { Customer } from "../types";

import { TabsContent } from "@/components/ui/tabs";

import { formatDate } from "@/lib/date";

type Props = {
  customer: Customer;
};

export function CustomerOverviewTab({ customer }: Props) {

  const emails = customer.emails ?? [];

  return (
    <TabsContent value="overview">
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Company Information */}

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">
            Company Information
          </h2>

          <dl className="space-y-5">
            <div>
              <dt className="text-sm text-muted-foreground">
                Company Name
              </dt>

              <dd>{customer.name}</dd>
            </div>

            <div>
              <dt className="text-sm text-muted-foreground">
                Email Addresses
              </dt>

              <dd>
                {emails.length > 0 ? (
                  <div className="space-y-1">
                    {emails.map((email) => (
                      <div key={email}>{email}</div>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-muted-foreground">
                Phone
              </dt>

              <dd>{customer.phone || "—"}</dd>
            </div>

            <div>
              <dt className="text-sm text-muted-foreground">
                Created
              </dt>

              <dd>{formatDate(customer.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Address */}

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">
            Address
          </h2>

          <dl className="space-y-5">
            <div>
              <dt className="text-sm text-muted-foreground">
                Physical Address
              </dt>

              <dd>
                {customer.address_1 ? (
                  <>
                    {customer.address_1}

                    {customer.address_2 && (
                      <>
                        <br />
                        {customer.address_2}
                      </>
                    )}

                    <br />

                    {customer.city}, {customer.state} {customer.zip}
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-muted-foreground">
                Billing Address
              </dt>

              <dd>
                {customer.billing_same_as_physical ? (
                  "Same as physical"
                ) : (
                  <>
                    {customer.billing_address_1}

                    {customer.billing_address_2 && (
                      <>
                        <br />
                        {customer.billing_address_2}
                      </>
                    )}

                    <br />

                    {customer.billing_city},{" "}
                    {customer.billing_state}{" "}
                    {customer.billing_zip}
                  </>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Payment Settings */}

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">
            Payment Settings
          </h2>

          <dl className="space-y-5">
            <div>
              <dt className="text-sm text-muted-foreground">
                Require PO
              </dt>

              <dd>{customer.require_po ? "Yes" : "No"}</dd>
            </div>


          </dl>
        </div>
      </div>
    </TabsContent>
  );
}
import { TabsContent } from "@/components/ui/tabs";

export function CustomerInvoicesTab() {
  return (
    <TabsContent value="invoices">
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No invoices yet.
      </div>
    </TabsContent>
  );
}
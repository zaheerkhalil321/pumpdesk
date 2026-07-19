import { TabsContent } from "@/components/ui/tabs";

export function CustomerContactsTab() {
  return (
    <TabsContent value="contacts">
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No contacts yet.
      </div>
    </TabsContent>
  );
}
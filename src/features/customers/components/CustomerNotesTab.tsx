import { TabsContent } from "@/components/ui/tabs";

export function CustomerNotesTab() {
  return (
    <TabsContent value="notes">
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No notes yet.
      </div>
    </TabsContent>
  );
}
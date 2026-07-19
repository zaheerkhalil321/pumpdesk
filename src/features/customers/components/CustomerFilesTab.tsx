import { TabsContent } from "@/components/ui/tabs";

export function CustomerFilesTab() {
  return (
    <TabsContent value="files">
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No files yet.
      </div>
    </TabsContent>
  );
}
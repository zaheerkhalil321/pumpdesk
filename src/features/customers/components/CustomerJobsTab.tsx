import { TabsContent } from "@/components/ui/tabs";

export function CustomerJobsTab() {
  return (
    <TabsContent value="jobs">
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No jobs yet.
      </div>
    </TabsContent>
  );
}
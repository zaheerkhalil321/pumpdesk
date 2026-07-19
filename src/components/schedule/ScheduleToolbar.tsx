"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
} from "lucide-react";

export function ScheduleToolbar() {
  return (
    <div className="flex h-16 items-center justify-between border-b px-6">

      <div className="flex items-center gap-3">

        <Button variant="outline" size="icon">
          <ChevronLeft className="size-4" />
        </Button>

        <Button variant="outline">
          Today
        </Button>

        <Button variant="outline" size="icon">
          <ChevronRight className="size-4" />
        </Button>

        <div className="ml-3 flex items-center gap-2 text-lg font-semibold">
          <Calendar className="size-5" />
          Tuesday, July 14
        </div>

      </div>

      <Button>
        <Plus className="size-4" />
        New Job
      </Button>

    </div>
  );
}
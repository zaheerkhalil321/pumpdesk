import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { formatDate } from "@/lib/date";

import type { Customer } from "@/features/customers/types";

type Props = {
    customer: Customer;
    editing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    saving?: boolean;
};

export function CustomerHeader({
    customer,
    editing,
    onEdit,
    onCancel,
    onSave,
    saving = false,
}: Props) {
    return (
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {customer.name}
                </h1>

                <div className="mt-2 flex items-center gap-3">
                    <Badge
                        variant={
                            customer.active
                                ? "default"
                                : "secondary"
                        }
                    >
                        {customer.active ? "Active" : "Inactive"}
                    </Badge>

                    <span className="text-sm text-muted-foreground">
                        Created {formatDate(customer.created_at)}
                    </span>
                </div>
            </div>

            {editing ? (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={onSave}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            ) : (
                <Button
                    variant="outline"
                    onClick={onEdit}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Customer
                </Button>
            )}
        </div>
    );
}
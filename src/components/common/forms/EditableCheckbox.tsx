import { Checkbox } from "@/components/ui/checkbox";

type Props = {
    label: string;

    editing: boolean;

    checked: boolean;

    onChange: (checked: boolean) => void;
};

export function EditableCheckbox({
    label,
    editing,
    checked,
    onChange,
}: Props) {
    return (
        <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
                {label}
            </label>

            {editing ? (
                <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                            onChange(value === true)
                        }
                    />

                    <span>
                        Require Purchase Order
                    </span>
                </div>
            ) : (
                <div>
                    {checked ? "Yes" : "No"}
                </div>
            )}
        </div>
    );
}
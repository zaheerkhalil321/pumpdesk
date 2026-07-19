import { Textarea } from "@/components/ui/textarea";

type Props = {
    label: string;

    editing: boolean;

    value: string;

    displayValue?: string;

    rows?: number;

    onChange: (value: string) => void;
};

export function EditableTextarea({
    label,
    editing,
    value,
    displayValue,
    rows = 4,
    onChange,
}: Props) {
    return (
        <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
                {label}
            </label>

            {editing ? (
                <Textarea
                    rows={rows}
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                />
            ) : (
                <div className="whitespace-pre-wrap">
                    {displayValue || "—"}
                </div>
            )}
        </div>
    );
}
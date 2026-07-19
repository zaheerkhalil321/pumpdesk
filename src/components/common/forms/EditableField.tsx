import { Input } from "@/components/ui/input";

type Props = {
    label: string;

    editing: boolean;

    value: string;

    displayValue?: string;

    placeholder?: string;

    maxLength?: number;

    onChange: (value: string) => void;
};

export function EditableField({
    label,
    editing,
    value,
    displayValue,
    placeholder,
    maxLength = 255,
    onChange,
}: Props) {
    return (
        <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
                {label}
            </label>

            {editing ? (
                <Input
                    value={value}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                />
            ) : (
                <div>
                    {displayValue || "—"}
                </div>
            )}
        </div>
    );
}
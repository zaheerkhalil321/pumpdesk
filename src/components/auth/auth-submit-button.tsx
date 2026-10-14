import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/loader';

interface AuthSubmitButtonProps {
  isLoading: boolean;
  label: string;
  loadingLabel: string;
}

export function AuthSubmitButton({ isLoading, label, loadingLabel }: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={isLoading}
      aria-busy={isLoading}
      className="h-11 w-full text-sm font-semibold"
    >
      {isLoading ? (
        <>
          <Spinner size="sm" label={null} />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

import { useAuth } from './useAuth';

// Before sign-in the app does not know the company yet, so a build can set a help number to call.
const HELP_PHONE = process.env.EXPO_PUBLIC_HELP_PHONE ?? '';

/**
 * The number "Text Dispatch" / "Call Dispatch" use: the operator's company phone (dashboard → company
 * settings). Before sign-in, the build's help number. Null when neither is set.
 */
export function useDispatchPhone(): string | null {
  const { operator } = useAuth();
  const phone = operator?.company?.dispatchPhone || HELP_PHONE;
  return phone ? phone : null;
}

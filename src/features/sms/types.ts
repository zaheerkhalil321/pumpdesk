/** What happened to a text: sent to Twilio, rejected by it, or only recorded (no Twilio keys set). */
export type SmsStatus = 'queued' | 'failed' | 'dry_run';

export interface SendTextResult {
  status: SmsStatus;
  /** Twilio's reason when the text was rejected. */
  errorMessage: string | null;
}

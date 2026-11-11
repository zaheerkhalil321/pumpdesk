/** What happened to a call: handed to Twilio, rejected by it, or only recorded (no Twilio keys set). */
export interface PlaceCallResult {
  status: 'queued' | 'failed' | 'dry_run';
  errorMessage: string | null;
}

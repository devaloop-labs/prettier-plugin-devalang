export type DurationValue =
  | { type: "BeatDuration"; value: string }
  | { type: "Milliseconds"; value: number }
  | { type: "AutoDuration"; value: "auto" };
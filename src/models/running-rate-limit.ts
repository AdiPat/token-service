interface RunningRateLimit {
  accessKeyValue: string;
  interval: number;
  remainingLimit: number;
  lastReset: Date | string;
}

export { RunningRateLimit };

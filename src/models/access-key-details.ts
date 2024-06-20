interface AccessKeyDetails {
  accessKey: string;
  limit: number;
  interval?: number; // default is 60s
  disabled: boolean;
  expiry: Date;
}

export { AccessKeyDetails };

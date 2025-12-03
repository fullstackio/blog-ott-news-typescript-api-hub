export interface IUserSubscription extends Document {
  firstName: string;
  lastName: string;
  email: string;
  deviceInfo: object;
  isActive: boolean;
  isDeleted: boolean;
  setSystemServerInfo?: object;
  createdAt: Date;
  updatedAt: Date;

  generatedAuthToken(): string;
}

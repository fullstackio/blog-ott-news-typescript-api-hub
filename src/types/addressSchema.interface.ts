export interface IAddress extends Document {
  userId: string;
  country: string;
  countryCode?: string;
  state: string;
  city: string;
  zipCode: string;
  address: string;
  street?: string;
  landMark?: string;
}

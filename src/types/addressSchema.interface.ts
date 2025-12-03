export interface IAddress extends Document {
  _id?: string;
  country: string;
  countryCode?: string;
  state: string;
  city: string;
  zipCode: string;
  address: string;
  street?: string;
  landMark?: string;
}

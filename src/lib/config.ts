export interface OrderSettings {
  delivery_fee: number;
  free_delivery_threshold: number;
  serviceable_postcodes: string[];
}
export const defaultSettings: OrderSettings = {
  delivery_fee: 4900,
  free_delivery_threshold: 49900,
  serviceable_postcodes: [
    "560001",
    "560002",
    "560003",
    "560004",
    "560005",
    "560008",
    "560025",
    "560034",
    "560038",
    "560095",
  ],
};

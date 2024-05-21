export type Product = {
    _id?: string;
    brands?: string;
    ean?: string;
    image_front_url?: string;
    name?: string;
    product_name?: string;
    product_name_fr?: string;
    generic_name?: string;
    generic_name_fr?: string;
    abbreviated_product_name?: string;
    abbreviated_product_name_fr?: string;
    date?: {
        day: any,
        month: any,
        year: any
    };
    options?: {
        color: string,
        content: string
    };
}
export type ModelType = 'box'|'bag'|'bottle'|'glass-bottle'|'can'|'jar'|'carton'|'tub'|'tray'|'fish-tray'|'poultry-tray'|'shellfish-tray'|'mussel-tray'|'crab-tray'|'salad-tray'|'eggs'|'tube'|'spray'|'rolls'|'apple'|'banana'|'citrus'|'grapes'|'berries'|'melon'|'pineapple'|'pear'|'carrot'|'leafy'|'broccoli'|'mushroom'|'pepper'|'root'|'loaf'|'baguette'|'croissant'|'doughnut'|'muffin'|'cookware'|'utensil'|'cutlery'|'container';
export interface Department {id:number;name:string;shortName:string;color:string;display:'produce'|'bakery'|'chilled'|'gondola'|'freezer'}
export interface Category {id:string;departmentId:number;name:string;slug:string}
export interface Subcategory {id:string;categoryId:string;name:string;slug:string}
export type VariantAttributes=Partial<Record<'size'|'weight'|'volume'|'flavour'|'colour'|'material'|'fragrance'|'packQuantity'|'packagingType'|'productType'|'style'|'fatContent'|'carbonation',string>>;
export interface CatalogueProduct {id:string;name:string;brand:string;departmentId:number;categoryId:string;subcategoryId:string;description:string;storage:string;origin:string;requiresExpiry:boolean}
export interface ProductVariant {id:string;productId:string;name:string;attributes:VariantAttributes;modelId:string;mediaId:string;dimensions:[number,number,number]}
export interface StockKeepingUnit {id:string;variantId:string;sku:string;priceCents:number;costCents:number;currency:string;barcode:string;reorderThreshold:number;inventoryLocationId:string;active:boolean}
export interface ProductBarcode {id:string;skuId:string;value:string;type:'EAN13'}
export interface ProductModel {id:string;name:string;kind:'PROCEDURAL';template:ModelType;modelPath:null}
export interface ProductMedia {id:string;imagePath:string;inspectionPath:string;texturePath:string;atlasIndex:number}
export type StockStatus='IN_STOCK'|'LOW_STOCK'|'OUT_OF_STOCK';
/** SKU projection used by the existing renderer and customer UI; normalized entities live in the API/database. */
export interface Product {
 id:string;name:string;brand:string;department:number;category:string;priceCents:number;currency:string;unit:string;description:string;stockQuantity:number;modelType:ModelType;color:string;dimensions:[number,number,number];imagePath:string;inspectionPath:string;atlasIndex:number;shelfLocation:{fixture:number;side:number;level:number;slot:number};isPromoted:boolean;discountPercent:number;storage:string;origin:string;ingredients?:string|null;allergens?:string|null;nutrition?:string|null;barcode:string;
 productId?:string;productName?:string;variantId?:string;productVariantId?:string;sku?:string;categoryId?:string;subcategoryId?:string;subcategory?:string;attributes?:VariantAttributes;costCents?:number;modelId?:string;mediaId?:string;reorderThreshold?:number;inventoryLocationId?:string;locationId?:string;rotationPolicy?:'FIFO'|'FEFO';stockStatus?:StockStatus;shelfStock?:number;backroomStock?:number;reservedStock?:number;availableStock?:number;requiresExpiry?:boolean;active?:boolean;
}

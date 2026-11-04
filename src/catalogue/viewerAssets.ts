/** Assets are keyed by SKU: a different size never inherits this 500 ml preview. */
export interface ViewerPhotos {frames:string[];label:string;}
export interface ProductViewerAssets {model:string;dimensions:[number,number,number];photos?:ViewerPhotos;referenceStatus:string;}
export const productViewerAssets:Record<string,ProductViewerAssets>={
 'still-water-500ml':{model:'/products/beverages/spring-water/500ml/model/product.glb',dimensions:[.065,.232,.065],referenceStatus:'Original 3D study based on supplied views; a verified photographic rotation sequence has not been supplied.'},
};

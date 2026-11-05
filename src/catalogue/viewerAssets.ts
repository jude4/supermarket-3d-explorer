/** Assets are keyed by SKU: other sizes and formulations keep their own models. */
export interface ViewerPhotos {frames:string[];label:string;}
export interface ProductViewerAssets {model:string;kind?:'embedded';dimensions:[number,number,number];photos?:ViewerPhotos;referenceStatus:string;}
export const productViewerAssets:Record<string,ProductViewerAssets>={
 'd4-001':{kind:'embedded',model:'/products/dairy/whole-milk/1l/product.glb',dimensions:[.073,.242,.073],referenceStatus:'Reference-based 1 litre carton study · Recreated artwork and estimated dimensions.'},
 'd7-028':{kind:'embedded',model:'/products/beverages/cola/330ml/product.glb',dimensions:[.066,.115,.066],referenceStatus:'Reference-based 330 ml can study with recreated artwork and estimated dimensions.'},
 'still-water-500ml':{model:'/products/beverages/spring-water/500ml/model/product.glb',dimensions:[.065,.232,.065],referenceStatus:'Original 3D study based on supplied views; a verified photographic rotation sequence has not been supplied.'},
};

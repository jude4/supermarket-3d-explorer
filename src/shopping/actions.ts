import {useExplorer,clearInput} from '../stores/useExplorer';
import {useShopping} from './useShopping';
export function openRetail(panel:NonNullable<ReturnType<typeof useShopping.getState>['panel']>,id?:string){
 clearInput();useExplorer.getState().setMode('paused');document.exitPointerLock?.();useShopping.getState().open(panel,id);
}

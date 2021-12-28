import { default as React } from 'react';
export interface Responsive<TFallback> {
    currentFallback: TFallback;
}
/**
 * A react context for responsive stuff.
 */
export declare const Context: React.Context<Responsive<any>>;
export declare const useResponsiveCurrentFallback: <TFallback extends {} = any>() => TFallback;
export declare type Fallbacks<T> = T[] & {
    0: T;
};
export interface ResponsiveProviderProps<TFallback> {
    fallbacks: Fallbacks<TFallback>;
    children: React.ReactNode | ((fallback: TFallback) => React.ReactNode);
}
export declare function ResponsiveProvider<TFallback>(props: ResponsiveProviderProps<TFallback>): JSX.Element;
export { ResponsiveProvider as default };

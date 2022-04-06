import { default as React } from 'react';
import type { SingleOrArray } from '@cssfn/types';
export interface Responsive<TFallback> {
    currentFallback: TFallback;
}
/**
 * A react context for responsive stuff.
 */
export declare const Context: React.Context<Responsive<any>>;
export declare const useResponsiveCurrentFallback: <TFallback extends {} = any>() => TFallback;
export declare const isOverflowed: (element: Element) => boolean;
export interface ResponsiveOptions {
    horzResponsive?: boolean;
    vertResponsive?: boolean;
}
export declare const useResponsive: (resizingElementRefs: SingleOrArray<React.RefObject<Element> | null>, responsiveCallback: () => void, options?: ResponsiveOptions) => void;
export declare type Fallbacks<T> = T[] & {
    0: T;
};
export interface ResponsiveProviderProps<TFallback> extends ResponsiveOptions {
    fallbacks: Fallbacks<TFallback>;
    children: React.ReactNode | ((fallback: TFallback) => React.ReactNode);
}
export declare function ResponsiveProvider<TFallback>(props: ResponsiveProviderProps<TFallback>): JSX.Element;
export { ResponsiveProvider as default };

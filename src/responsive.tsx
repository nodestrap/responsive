// react:
import {
    default as React,
    useState,
    useRef as _useRef, // avoids eslint check
    createContext,
    useContext,
    
    Children,
    isValidElement,
    cloneElement,
}                           from 'react'         // base technology of our nodestrap components

// nodestrap utilities:
import {
    useIsomorphicLayoutEffect,
}                           from '@nodestrap/hooks'
import {
    // utilities:
    setRef,
    parseNumber,
}                           from '@nodestrap/utilities'
import {
    // hooks:
    SizeOptions,
    useElementSize as _useElementSize, // avoids eslint check
}                           from '@nodestrap/dimensions'



// contexts:

export interface Responsive<TFallback> {
    currentFallback : TFallback
}

/**
 * A react context for responsive stuff.
 */
export const Context = createContext<Responsive<any>>(/*defaultValue :*/{
    currentFallback : undefined,
});
Context.displayName  = 'Responsive';



// hooks:

export const useResponsiveCurrentFallback = <TFallback extends {} = any>() => {
    // contexts:
    const responsiveContext = useContext(Context);
    return responsiveContext.currentFallback as TFallback;
};



// utilities:

const someOverflowedDescendant = (maxRight: number|null, maxBottom: number|null, parent: Element): boolean => {
    if (Array.from(parent.children).some((child) => {
        const { right: childRight, bottom: childBottom } = child.getBoundingClientRect();
        if (
            (
                (maxRight    !== null)
                &&
                (childRight  !== maxRight )
                &&
                (
                    (Number.isInteger(childRight) && Number.isInteger(maxRight))
                    ?
                    (childRight   > maxRight )
                    :
                    ((childRight  - maxRight ) > -0.6)
                )
            )
            ||
            (
                (maxBottom   !== null)
                &&
                (childBottom !== maxBottom)
                &&
                (
                    (Number.isInteger(childBottom) && Number.isInteger(maxBottom))
                    ?
                    (childBottom  > maxBottom)
                    :
                    ((childBottom - maxBottom) > -0.6)
                )
            )
        ) return true; // found
        
        return someOverflowedDescendant(maxRight, maxBottom, child); // nested search
    })) return true; // found
    
    return false; // not found
};



// caches:

const elementSizeOptions : SizeOptions = { box: 'content-box' };



// react components:

export type Fallbacks<T> = T[] & { 0: T }
export interface ResponsiveProviderProps<TFallback> {
    fallbacks : Fallbacks<TFallback>
    children  : React.ReactNode | ((fallback: TFallback) => React.ReactNode)
}
export function ResponsiveProvider<TFallback>(props: ResponsiveProviderProps<TFallback>) {
    // rest props:
    const {
        fallbacks,
        
        
        // children:
        children,
    } = props;
    
    
    
    // states:
    const [currentFallbackIndex, setCurrentFallbackIndex] = useState<number>(0);
    
    
    
    // fn props:
    const maxFallbackIndex  = (fallbacks.length - 1);
    const currentFallback   = (currentFallbackIndex <= maxFallbackIndex) ? fallbacks[currentFallbackIndex] : fallbacks[maxFallbackIndex];
    
    const childrenAbs       = (typeof(children) !== 'function') ? children : children(currentFallback);
    const childrenWithSizes = Children.toArray(childrenAbs).map((child) => {
        if (!isValidElement(child)) return {
            child : child,
            ref   : null,
            size  : null,
        };
        
        
        
        const childRef                 = _useRef<HTMLElement>(null);
        const [childSize, setChildRef] = _useElementSize(elementSizeOptions);
        const refName                  = (typeof(child.type) !== 'function') ? 'ref' : 'outerRef';
        const mutatedChild             = cloneElement(child, {
            [refName]: (elm: HTMLElement) => {
                setRef((child as any)[refName], elm);
                
                setRef(childRef               , elm);
                setRef(setChildRef            , elm);
            },
        });
        
        return {
            child : mutatedChild,
            ref   : childRef,
            size  : childSize,
        };
    });
    const sizes = childrenWithSizes.map((childWithSize) => childWithSize.size).filter((size): size is NonNullable<typeof size> => !!size);
    
    
    
    // dom effects:
    useIsomorphicLayoutEffect(() => {
        if (currentFallbackIndex === 0) return; // already been reseted
        
        
        
        // setups:
        setCurrentFallbackIndex(0);
    }, sizes); // resets currentFallbackIndex each time the sizes are changed

    useIsomorphicLayoutEffect(() => {
        if (currentFallbackIndex >= maxFallbackIndex) return; // maximum fallbacks has already reached => nothing more fallback
        
        
        
        const hasOverflowed = childrenWithSizes.some((childWithSize): boolean => {
            const {
                ref,
                size,
            } = childWithSize;
            const elm = ref?.current;
            if (!elm)                  return false; // ignore non-element-child or not-already-referenced-child
            if (!size)                 return false; // ignore non-element-child
            
            const {
                width  : clientWidth,
                height : clientHeight,
            } = size;
            if (clientWidth  === null) return false; // ignore not-already-calculated-child
            if (clientHeight === null) return false; // ignore not-already-calculated-child
            
            
            
            const {
                scrollWidth,
                scrollHeight
            } = elm;
            
            
            
            if (
                (scrollWidth  > clientWidth ) // horz scrollbar detected
                ||
                (scrollHeight > clientHeight) // vert scrollbar detected
            ) return true;
            
            
            
            const { right: elmRight, bottom: elmBottom } = elm.getBoundingClientRect();
            const { paddingInlineEnd, paddingBlockEnd  } = getComputedStyle(elm);
            const marginRight  = (parseNumber(paddingInlineEnd) ?? 0);
            const marginBottom = (parseNumber(paddingBlockEnd)  ?? 0);
            const maxRight  = marginRight  ? (elmRight  - marginRight)  : null;
            const maxBottom = marginBottom ? (elmBottom - marginBottom) : null;
            if ((maxRight === null) && (maxBottom === null)) return false;
            
            return someOverflowedDescendant(maxRight, maxBottom, elm);
        });
        if (hasOverflowed) setCurrentFallbackIndex(currentFallbackIndex + 1);
    }); // run on every render & DOM has been updated
    
    
    
    // jsx:
    return (
        <Context.Provider value={{ currentFallback }}>
            { childrenWithSizes.map((childWithSize) => childWithSize.child) }
        </Context.Provider>
    );
}
export { ResponsiveProvider as default }

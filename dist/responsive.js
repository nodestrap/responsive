// react:
import { default as React, useState, useRef, useRef as _useRef, // avoids eslint check
useCallback, createContext, useContext, Children, isValidElement, cloneElement, } from 'react'; // base technology of our nodestrap components
// nodestrap utilities:
import { 
// hooks:
useIsomorphicLayoutEffect, useTriggerRender, } from '@nodestrap/hooks';
import { 
// utilities:
setRef, parseNumber, } from '@nodestrap/utilities';
/**
 * A react context for responsive stuff.
 */
export const Context = createContext(/*defaultValue :*/ {
    currentFallback: undefined,
});
Context.displayName = 'Responsive';
// hooks:
export const useResponsiveCurrentFallback = () => {
    // contexts:
    const responsiveContext = useContext(Context);
    return responsiveContext.currentFallback;
};
// utilities:
const isOverflowable = (element) => {
    const { display,
    // overflowX,
    // overflowY,
     } = getComputedStyle(element);
    if (display === 'none')
        return false; // hidden element => not overflowable
    // if (
    //     (overflowX !== 'visible')
    //     &&
    //     (overflowY !== 'visible')
    // )                       return false; // hidden/scroll/clip/overlay/auto/ => not overflowable
    return true;
};
const hasOverflowedDescendant = (element, minLeft, minTop, maxRight, maxBottom) => {
    if (Array.from(element.children).some((child) => {
        if (!isOverflowable(child))
            return false;
        let { left: childLeft, top: childTop, right: childRight, bottom: childBottom, } = child.getBoundingClientRect();
        childLeft = Math.round(childLeft);
        childTop = Math.round(childTop);
        childRight = Math.round(childRight);
        childBottom = Math.round(childBottom);
        const { marginLeft: marginLeftStr, marginTop: marginTopStr, marginRight: marginRightStr, marginBottom: marginBottomStr, } = getComputedStyle(child);
        const marginLeft = (parseNumber(marginLeftStr) ?? 0);
        const marginTop = (parseNumber(marginTopStr) ?? 0);
        const marginRight = (parseNumber(marginRightStr) ?? 0);
        const marginBottom = (parseNumber(marginBottomStr) ?? 0);
        const minLeftShift = (minLeft === null) ? null : Math.round(minLeft + marginLeft);
        const minTopShift = (minTop === null) ? null : Math.round(minTop + marginTop);
        const maxRightShift = (maxRight === null) ? null : Math.round(maxRight - marginRight);
        const maxBottomShift = (maxBottom === null) ? null : Math.round(maxBottom - marginBottom);
        if (((minLeftShift !== null)
            &&
                (childLeft < minLeftShift) // smaller than minimum => overflowed
        )
            ||
                ((minTopShift !== null)
                    &&
                        (childTop < minTopShift) // smaller than minimum => overflowed
                )
            ||
                ((maxRightShift !== null)
                    &&
                        (childRight > maxRightShift) // bigger than maximum => overflowed
                )
            ||
                ((maxBottomShift !== null)
                    &&
                        (childBottom > maxBottomShift) // bigger than maximum => overflowed
                )) {
            return true; // found
        } // if
        return hasOverflowedDescendant(child, minLeftShift, minTopShift, maxRightShift, maxBottomShift); // nested search
    }))
        return true; // found
    return false; // not found
};
export const isOverflowed = (element) => {
    if (!isOverflowable(element))
        return false;
    const { clientWidth, clientHeight, scrollWidth, scrollHeight, } = element;
    if ((scrollWidth > clientWidth) // horz scrollbar detected
        ||
            (scrollHeight > clientHeight) // vert scrollbar detected
    ) {
        return true;
    } // if
    //#region handle padding right & bottom
    const { paddingLeft: paddingLeftStr, paddingTop: paddingTopStr, paddingRight: paddingRightStr, paddingBottom: paddingBottomStr, } = getComputedStyle(element);
    const paddingLeft = (parseNumber(paddingLeftStr) ?? 0);
    const paddingTop = (parseNumber(paddingTopStr) ?? 0);
    const paddingRight = (parseNumber(paddingRightStr) ?? 0);
    const paddingBottom = (parseNumber(paddingBottomStr) ?? 0);
    const { left: elmLeft, top: elmTop, right: elmRight, bottom: elmBottom, } = element.getBoundingClientRect();
    const minLeft = Math.round(elmLeft + paddingLeft);
    const minTop = Math.round(elmTop + paddingTop);
    const maxRight = Math.round(elmRight - paddingRight);
    const maxBottom = Math.round(elmBottom - paddingBottom);
    return hasOverflowedDescendant(element, minLeft, minTop, maxRight, maxBottom);
    //#endregion handle padding right & bottom
};
export const useResponsive = (resizingElementRefs, responsiveCallback, options = {}) => {
    // options:
    const { horzResponsive = true, vertResponsive = false, } = options;
    // states:
    const prevSizes = useRef(undefined); // initial sizes is unknown (undefined) because the DOM is not already mounted
    // dom effects:
    useIsomorphicLayoutEffect(() => {
        // setups:
        const resizingElements = [resizingElementRefs].flat().map((elmRef) => elmRef?.current ?? null);
        const handleResize = () => {
            const overflowableChildren = (resizingElements
                .map((element) => (element && isOverflowable(element) && element) || null));
            const currentWidths = horzResponsive ? (overflowableChildren
                .map((element) => element && element.clientWidth)) : [];
            const currentHeights = vertResponsive ? (overflowableChildren
                .map((element) => element && element.clientHeight)) : [];
            const currentSizes = [...currentWidths, ...currentHeights];
            // watch for changes by comparing currentSizes vs oldSizes:
            const oldSizes = prevSizes.current;
            if (!(() => {
                if (oldSizes === undefined)
                    return false; // never assigned => difference detected
                if (currentSizes.length !== oldSizes.length)
                    return false; // difference detected
                for (let i = 0; i < currentSizes.length; i++) {
                    if (currentSizes[i] !== oldSizes[i])
                        return false; // difference detected
                } // for
                return true; // no differences detected
            })()) {
                prevSizes.current = currentSizes; // update changes
                if (oldSizes !== undefined) { // only second..third..next update triggers `responsiveCallback`
                    responsiveCallback();
                } // if
            } // if
        };
        const observer = new ResizeObserver(handleResize);
        const sizeOptions = { box: 'content-box' }; // only watch for client area
        resizingElements.forEach((element) => element && observer.observe(element, sizeOptions));
        // cleanups:
        return () => {
            observer.disconnect();
        };
    }, [resizingElementRefs, horzResponsive, vertResponsive, responsiveCallback]); // runs once
};
export function ResponsiveProvider(props) {
    // rest props:
    const { 
    // responsives:
    fallbacks, horzResponsive, vertResponsive, 
    // children:
    children: childrenFn, } = props;
    // states:
    const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);
    // fn props:
    const maxFallbackIndex = (fallbacks.length - 1);
    const currentFallback = (currentFallbackIndex <= maxFallbackIndex) ? fallbacks[currentFallbackIndex] : fallbacks[maxFallbackIndex];
    const children = (typeof (childrenFn) !== 'function') ? childrenFn : childrenFn(currentFallback);
    const childrenWithRefs = Children.toArray(children).map((child) => {
        if (!isValidElement(child))
            return {
                child: child,
                ref: null,
            };
        const childRef = _useRef(null);
        const refName = (typeof (child.type) !== 'function') ? 'ref' : 'outerRef';
        const childWithRef = cloneElement(child, {
            [refName]: (elm) => {
                setRef(child[refName], elm);
                setRef(childRef, elm);
            },
        });
        return {
            child: childWithRef,
            ref: childRef,
        };
    });
    // dom effects:
    const childrenRefs = childrenWithRefs.map(({ ref }) => ref);
    const triggerRender = useTriggerRender();
    const responsiveCallback = useCallback(() => {
        if (currentFallbackIndex === 0) {
            triggerRender();
        }
        else {
            setCurrentFallbackIndex(0);
        } // if
    }, [currentFallbackIndex, triggerRender]);
    useResponsive(childrenRefs, responsiveCallback, { horzResponsive, vertResponsive });
    // eslint-disable-next-line
    useIsomorphicLayoutEffect(() => {
        // conditions:
        if (currentFallbackIndex >= maxFallbackIndex)
            return; // maximum fallbacks has already reached => nothing more fallback
        const hasOverflowed = childrenRefs.some((childRef) => {
            const child = childRef?.current;
            if (!child)
                return false;
            return isOverflowed(child);
        });
        if (hasOverflowed) {
            setCurrentFallbackIndex(currentFallbackIndex + 1);
        } // if
    }); // runs on every render & DOM has been updated
    // jsx:
    return (React.createElement(Context.Provider, { value: { currentFallback } }, childrenWithRefs.map(({ child }) => child)));
}
export { ResponsiveProvider as default };

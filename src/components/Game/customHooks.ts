import { useEffect, useRef } from "react";

export const usePrevious = (value: boolean) => {
    const ref = useRef<boolean>();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}
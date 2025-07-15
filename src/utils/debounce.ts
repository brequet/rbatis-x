/**
 * Creates a debounced function that delays invoking `func` until after `waitFor`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 *
 * @param func The function to debounce.
 * @param waitFor The number of milliseconds to delay.
 * @returns A new debounced function.
 */
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            clearTimeout(timeout);
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
}

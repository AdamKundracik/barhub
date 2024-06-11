export function truncate(str: string, n: number) {
    if (str)
        return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
    return ''
};

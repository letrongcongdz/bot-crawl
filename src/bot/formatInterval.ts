export function formatInterval(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    } else {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
}

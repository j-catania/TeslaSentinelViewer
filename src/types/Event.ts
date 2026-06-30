// Raw shape of event.json written by Tesla firmware
export type TeslaEventJSON = {
    timestamp: string,
    city: string,
    est_lat: number,
    est_lon: number,
    reason: string,
    camera: number,
}

// App-level enriched event: timestamp converted to Date, root path injected
export type Event = Omit<TeslaEventJSON, 'timestamp'> & {
    timestamp: Date,
    root: string,
}

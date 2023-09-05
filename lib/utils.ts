export const uniqueByKey = <T>(source: T[], keyExtractor: (obj: T) => string): string[] =>
    Array.from(new Set(source.map(v => keyExtractor(v))))

export const splitIntoChunks = <T>(records: T[], chunkSize: number): T[][] => {
    const result: T[][] = []
    for (let i = 0; i < records.length; i += chunkSize) {
        result.push(records.slice(i, i + chunkSize))
    }
    return result
}
// `/dev/api/v1/profiles` -> `/api/v1/profiles`
export const trimPath = (path: string) => `/${path.split('/').slice(2).join('/')}`
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

export const isInt = (val: string): boolean => Number.isInteger(parseInt(val))

export const composeDynamoFilters = (params: Record<string, string>,
                                     filterAttrs: string[]): {
    filterExp?: string
    expAttrVals?: Record<string, string>
    exprAttrNames?: Record<string, string>
} => {
    const filterExpr: string[] = []
    let attrVals = {} as Record<string, string>
    let attrNames = {} as Record<string, string>
    filterAttrs.forEach((attr) => {
        const param = params[attr]
        if (param) {
            filterExpr.push(`#${attr} = :${attr}`)
            attrNames = {...attrNames, [`#${attr}`]: attr}
            attrVals = {...attrVals, [`:${attr}`]: param}
        }
    })
    let result = {} as ReturnType<typeof composeDynamoFilters>
    if (filterExpr.length) {
        result = {
            filterExp: filterExpr.join(' AND '),
        }
    }
    if (Object.keys(attrVals).length) {
        result = {
            ...result,
            expAttrVals: attrVals,
        }
    }
    if (Object.keys(attrNames).length) {
        result = {
            ...result,
            exprAttrNames: attrNames,
        }
    }
    return result
}
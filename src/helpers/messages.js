
exports.generateReply = (
    status,
    code,
    verb,
    dbName,
    colName,
    total,
    hrend,
    errormessage = '',
    items = null,
    query = {},
    fields = {},
    sort = {},
    skip = 0,
    limit = 0) => {
        let rep = {
            "platform" : {
                "type" : "api",
                "version" : "v1",
                "resource" : dbName + '/' + colName
            },
            "request" : {
                "status" : status,
                "code" : code,
                "errormessage" : errormessage,
                "method" : verb,
                //"elapsedtimems" : hrend[1] / 1000000 || 'NA',
                "elapsedtime" : hrend[0] + 's ' + (hrend[1]/1e6).toFixed(3) + 'ms',
                "query" : query,
                "fields" : fields,
                "sort" : sort,
                "skip" : skip,
                "limit" : limit,
                "total" : total
            },
            "response" : items
        }
    return rep;
}
const { Client } = require('verge-node-typescript')
const CronJob = require('cron').CronJob;
const sleep = require('sleep')
const Influx = require('influx');

const clientSettings = require('../../credentials.json')

const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'vergetime',
    schema: [
        {
            measurement: 'blocktime',
            fields: {
                meanSpreadBlock: Influx.FieldType.FLOAT,
                timeSpreadBlock: Influx.FieldType.FLOAT,
            },
            tags: ["host"]
        }]
})

const verge = new Client(clientSettings)
const MAX_BLOCK_COUNT = 100
new CronJob('* * * * *', () => {
    verge.send('getblockcount').then((blockCount) => {
        const blockToStart = blockCount - MAX_BLOCK_COUNT;
        const timestamps = [];
        for (var i = blockToStart; i <= blockCount; i++) {
            if (i % 10 === 0) sleep.msleep(100)

            timestamps.push(
                verge.send('getblockhash', i).then((hash) =>
                    verge.send('getblock', hash).then((block) =>
                        block
                    )
                )
            )

        }

        Promise.all(timestamps).then((timestampArray) => {
            let timeDifference = 0
            let medianTimeDifference = 0
            timestampArray.forEach((_, index) => {
                if (index > 0) {
                    timeDifference += timestampArray[index].time - timestampArray[index - 1].time
                    medianTimeDifference += timestampArray[index].mediantime - timestampArray[index - 1].mediantime
                }
            })

            const timeSpreadBlock = timeDifference / MAX_BLOCK_COUNT
            const meanSpreadBlock = medianTimeDifference / MAX_BLOCK_COUNT

            return influx.writePoints([
                {
                    measurement: 'blocktime',
                    tags: { host: 'vergetime' },
                    fields: {
                        meanSpreadBlock,
                        timeSpreadBlock
                    },
                }
            ]).catch(console.error)
        }).catch(console.error)
    }).catch(console.error)
}, null, true, 'America/Los_Angeles')

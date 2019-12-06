const { Client } = require('verge-node-typescript')
const Influx = require('influx');
const CronJob = require('cron').CronJob;
const got = require('got')
const clientSettings = require('../../credentials.json')

const influx = new Influx.InfluxDB({
  host: 'localhost',
  database: 'meta',
  schema: [
    {
      measurement: 'info',
      fields: {
        volume_turnover_last_24_hours_percent: Influx.FieldType.FLOAT,

        transaction_volume: Influx.FieldType.FLOAT,
        adjusted_transaction_volume: Influx.FieldType.FLOAT,
        nvt: Influx.FieldType.FLOAT,

        sum_of_fees_24_usd: Influx.FieldType.FLOAT,
        median_tx_xvg: Influx.FieldType.FLOAT,

        count_of_active_addresses: Influx.FieldType.INTEGER,
        count_of_tx: Influx.FieldType.INTEGER,
        count_of_payments: Influx.FieldType.INTEGER,

        new_issuance_usd_24: Influx.FieldType.FLOAT,
        kilobytes_added: Influx.FieldType.FLOAT,
        count_of_blocks_added: Influx.FieldType.INTEGER,
      },
      tags: ["host"]
    }
  ]
})

const custom = got.extend({
  responseType: 'json',
});

const writePoints = (fields) => influx.writePoints([
  {
    measurement: 'info',
    tags: { host: 'verge' },
    fields,
  }
]).catch(console.error)

new CronJob('* * * * *', () => {
  custom('https://data.messari.io/api/v1/assets/xvg/metrics')
    .then(({ body: { data: metric } }) => ({
      volume_turnover_last_24_hours_percent: metric.marketcap.volume_turnover_last_24_hours_percent,

      transaction_volume: metric.blockchain_stats_24_hours.transaction_volume,
      adjusted_transaction_volume: metric.blockchain_stats_24_hours.adjusted_transaction_volume,
      nvt: metric.blockchain_stats_24_hours.nvt,

      sum_of_fees_24_usd: metric.blockchain_stats_24_hours.sum_of_fees,
      median_tx_xvg: metric.blockchain_stats_24_hours.median_tx_value,

      count_of_active_addresses: metric.blockchain_stats_24_hours.count_of_active_addresses,
      count_of_tx: metric.blockchain_stats_24_hours.count_of_tx,
      count_of_payments: metric.blockchain_stats_24_hours.count_of_payments,

      new_issuance_usd_24: metric.blockchain_stats_24_hours.new_issuance,
      kilobytes_added: metric.blockchain_stats_24_hours.kilobytes_added,
      count_of_blocks_added: metric.blockchain_stats_24_hours.count_of_blocks_added,
    }))
    .then(writePoints)
    .then(() => console.log("Wrote meta metrics ..."))
    .catch(console.error)
}, null, true, 'America/Los_Angeles')

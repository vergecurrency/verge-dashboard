const { Client } = require('verge-node-typescript')
const Influx = require('influx');
const CronJob = require('cron').CronJob;
const clientSettings = require('./credentials.json')

const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'verge',
    schema: [
      {
        measurement: 'info',
        fields: {
          blocks: Influx.FieldType.INTEGER,
          headers: Influx.FieldType.INTEGER,
          connections: Influx.FieldType.INTEGER,
        },
        tags: ["host"]
      },
      {
          measurement: 'difficulty',
          fields: {
            x17: Influx.FieldType.FLOAT,
            scrypt: Influx.FieldType.FLOAT,
            groestl: Influx.FieldType.FLOAT,
            lyra2re: Influx.FieldType.FLOAT,
            blake: Influx.FieldType.FLOAT
          },
          tags: ["host"]
      },
      {
        measurement: 'hashpower',
        fields: {
            scrypt: Influx.FieldType.INTEGER,
            groestl: Influx.FieldType.INTEGER,
            lyra2re: Influx.FieldType.INTEGER,
            x17: Influx.FieldType.INTEGER,
            blake2s: Influx.FieldType.INTEGER
        },
        tags: ["host"]
      },
      {
          measurement: 'mempool',
          fields: {
            size: Influx.FieldType.INTEGER,
            bytes: Influx.FieldType.INTEGER,
            usage: Influx.FieldType.INTEGER,
            maxmempool: Influx.FieldType.INTEGER,
            mempoolminfee: Influx.FieldType.FLOAT,
            minrelaytxfee: Influx.FieldType.FLOAT
          },
          tags: ["host"]
      },
        {
            measurement: 'network',
            fields: {
                timeoffset: Influx.FieldType.INTEGER,
                connections: Influx.FieldType.INTEGER,
            },
            tags: ["host"]
        }
    ]
   })
   
const client = new Client(clientSettings)

new CronJob('* * * * *', () => {
  Promise.all([ client.send('getinfo'), client.send('getmempoolinfo'), client.send('getallnetworkhashps'), client.send('getnetworkinfo')]).then(([info, mempool, hash, network]) => {
    return influx.writePoints([
        {
            measurement: 'info',
            tags: { host: 'verge' },
            fields: { 
              blocks: info.blocks,
              headers: info.headers,
              connections: info.connections,
            },
        },
        {
            measurement: 'difficulty',
            tags: { host: 'verge' },
            fields: { 
              x17: info.difficulty_x17,
              scrypt: info.difficulty_scrypt,
              groestl: info.difficulty_groestl,
              lyra2re: info.difficulty_lyra2re,
              blake: info.difficulty_blake
            },
        },
        {
            measurement: 'hashpower',
            tags: { host: 'verge' },
            fields: { 
              scrypt: hash.scrypt,
              groestl: hash.groestl,
              lyra2re: hash.lyra2re,
              x17: hash.x17,
              blake2s: hash.blake2s 
            },
        },
        {
            measurement: 'mempool',
            tags: { host: 'verge' },
            fields: { 
              size: mempool.size,
              bytes: mempool.bytes,
              usage: mempool.usage,
              maxmempool: mempool.maxmempool,
              mempoolminfee: mempool.mempoolminfee,
              minrelaytxfee: mempool.minrelaytxfee
            },
        },
        {
            measurement: 'network',
            tags: { host: 'verge' },
            fields: { 
              timeoffset: network.timeoffset,
              connections: network.connections,
            },
        }
      ]).catch(console.error)
  }).then(() => console.log("Wrote points to database.")).catch(console.error)
}, null, true, 'America/Los_Angeles')

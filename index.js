
const mongoose = require("mongoose");
const cron = require("node-cron");
const worker = require("./src/plugins/worker");
const { doData } = require("./src/services/collect");
const connect = require("./src/plugins/db");

const dbName = process.env.dbName;
const modelName = process.env.modelName;
const mongoUser = process.env.collectMongoUser;
const mongoPassword = process.env.collectMongoPassword;
const mongoIp = process.env.mongoIp;
const mongoOptions ="retryWrites=true&w=majority";

const dbConnectionString = `mongodb+srv://${ mongoUser }:${ mongoPassword }@${ mongoIp }/${ dbName }?${ mongoOptions }`;

( async ()=>{
  const offs = await connect(mongoose, dbConnectionString, {
    serialNumber: { type: String, required: true},
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    distance: { type: String, required: true },
    spotTime: { type: Date, expires: 600, required: true }
  }, modelName, dbName);
  worker(()=>{
    cron.schedule('*/2 * * * * *', () => { doData( offs ); });
  });

})();
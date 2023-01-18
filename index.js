
const mongoose = require("mongoose");
const cron = require("node-cron");
const { doData } = require("./src/services/collect");
const connect = require("./src/plugins/db/index");
( async ()=>{
  const modelName = "Offenders";
  const dbName = ""
  const dbConnectionString = process.env?.dbConnectionString ? process.env.dbConnectionString : `mongodb+srv://admin:nFzUj6IWX8y9FvcR@learningcluster.bhg1u.mongodb.net/?retryWrites=true&w=majority`;
  const offs = await connect(mongoose, dbConnectionString, {
    serialNumber: { type: String, required: true},
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    distance: { type: String, required: true },
    spotTime: { type: Date, expires: 600, required: true }
  }, modelName, dbName);
  cron.schedule('*/2 * * * * *', () => { doData( offs ); });
})();
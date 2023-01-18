
const connect = async ( mongoose, connectionString, schema, modelName, dbName ) => {
  const connection = await mongoose.connect( connectionString );
  const dbDataSchema = new mongoose.Schema( schema );
  const model = connection.model( modelName, dbDataSchema, dbName );
  //return mongoose;
  return model;
}
module.exports = connect;

const connect = async ( mongoose, connectionString, schema, modelName, dbName ) => {
  mongoose.set('strictQuery', true);
  const connection = await mongoose.connect( connectionString );
  const dbDataSchema = new mongoose.Schema( schema );
  const model = connection.model( modelName, dbDataSchema, dbName );
  return model;
}
module.exports = connect;
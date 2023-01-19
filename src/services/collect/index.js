const axios = require('axios');
const convert = require("xml-js");
const error = require("../../plugins/error");
const NOFLYDISTANCE = 100000;

/*                                   Functions for Working with drones data source                                                         */


const getObjectFromElement = ({ name, elements }) => {
  return { [ name ]: elements[0].text };
}
const selectElementsByNames = ( elements, names ) => {
  return elements.filter(( item )=>{
    for( let i = 0; i < names.length; i++ ) {
      if ( item.name === names[i] ) {
        return item;
      }
    }
  });
}
const getDroneData = ( elements, fields )=>{
  const filtered = selectElementsByNames( elements,fields );
  let obj = {}
  for ( let i = 0; i < filtered.length; i++) {
    obj = { ...obj, ...getObjectFromElement( filtered[i] )};
  }
  return obj;
}
const calculateDistance = ( x1, x2, y1, y2 ) => {
  const sumOfSqCatheti = (( x1 - x2 ) ** 2 ) + (( y1 - y2 ) ** 2);
  const dist = Math.sqrt( sumOfSqCatheti );
  return dist;
}

const getDrones = ( src ) => {
  return src.elements[0].elements[1].elements;
}
const getTimeStamp = ( src ) => {
  return src.elements[ 0 ].elements[1].attributes.snapshotTimestamp;
}
const processDroneData = ( res ) => {

  const result = JSON.parse( convert.xml2json( res.data ));

  const timestamp = getTimeStamp( result );
  const drones = getDrones( result );
  const illegalDronesData = [];
  for ( let i = 0; i < drones.length; i++ ) {
    const drone = getDroneData(drones[ i ].elements, ["serialNumber","positionY","positionX"]);
    const distance = calculateDistance(drone.positionX, 250000, drone.positionY, 250000);
    if (distance <= NOFLYDISTANCE){
      illegalDronesData.push({drone, distance});
    }
  }
  if( illegalDronesData.length > 0) {
    return { illegalDronesData, timestamp };
  }
}
/*                                   Functions for Working with drone owners data source                                                         */
const processOwnerData = ( illegalDrones ) => {

  const dataEntries = [];
  for ( let i = 0; i < illegalDrones?.illegalDronesData.length; i++) {
    const { serialNumber } = illegalDrones.illegalDronesData[ i ].drone;
    dataEntries.push( axios.get(`https://assignments.reaktor.com/birdnest/pilots/${ serialNumber }`).then(( res ) => {
      const { firstName, lastName, phoneNumber, email } = res.data;
      return { serialNumber, name: `${ firstName } ${ lastName }`, phone: phoneNumber, email, spotTime: illegalDrones.timestamp, distance: illegalDrones.illegalDronesData[ i ].distance };
    }).catch( error ));
  }
  return dataEntries;
};

const combine = async ( db ) => {
  const doDb = async ( dataEntries ) => {

    if (dataEntries.length > 0){
      const options = { upsert: true };
      dataEntries.forEach(
        promise => {
          promise.then(async( entry )=>{
            const { serialNumber, distance } = entry;
            const [exists] = await db.find({ serialNumber }, "-_id distance").lean();
            if ( exists ) {
              if (exists.distance < distance) {
                entry.distance = exists.distance;
              }
            }
            await db.updateOne({ serialNumber }, {  ...entry }, options);
          }).catch(error);
        });
    }
  }
  axios.get("https://assignments.reaktor.com/birdnest/drones").then( processDroneData ).catch(error).then( processOwnerData ).catch(error).then( doDb ).catch(error);
}

module.exports = { doData: combine }

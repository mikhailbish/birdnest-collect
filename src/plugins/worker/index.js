let throng = require('throng');

function worker( task ) {
  throng( task );
}
module.exports = worker;
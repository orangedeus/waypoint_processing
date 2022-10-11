require('dotenv').config({ path: '.env.local' });

var config = {
    WAYPOINT_BACKEND_API: process.env.WAYPOINT_BACKEND_API || ""
}


module.exports = config;

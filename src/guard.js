var Entity = require("./entity.js");

function Guard(){
	Entity.call(this, "guard", 5, 10);
}

util.Class(Guard, Entity, {

});

module.exports = Guard
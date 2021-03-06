var $h = require("../lib/headOn.js");
var Class = require("./utils").Class;
var engine = require("./engine").getInstance();
var Entity = require("./entity");
var Guard = require("./guard");
var loading = exports.loading = {
	enter: function(){
		var that = this;
		this.percent = 0;
		$h.events.listen("assestsLoaded", function(){
			that.loaded = true;
		});
		$h.events.listen("percentLoaded", function(p){
			that.percentChange = true;
			that.percent = p;
		});
		this.percentChange = true;
	},
	exit: function(){
	},
	render: function(gameState, canvas){
		if(this.percentChange){
			canvas.drawRect(canvas.width, canvas.height, 0,0, "black");
			canvas.drawText("loading: "+this.percent*100 + "%", canvas.width/2, canvas.height/2, "50px", "white", "center");
			this.percentChange = false;
		}

	},
	update: function(gameState, delta){
		if(this.loaded){
			gameState.changeState(gameplay);
		}
	}
};

var gameplay = exports.gameplay = {
	enter: function(){
		this.d = new Guard(500, 200);
		engine.clearBuffers();
		this.last = 0;
	},
	exit: function(){
	},
	render: function(gameState, canvas){
		engine.renderLevel();
		//canvas.drawRect(canvas.width, canvas.height, 0,0, "purple")
		canvas.canvas.ctx.clearRect(0,0, canvas.width, canvas.height);
		var len = engine.entities.length;
		var en;
		for(var i=0; i<len; i++){
			en = engine.entities[i];
			if(en.isActive()){
				en.render(canvas);
			}
		}

	},
	update: function(gamestate, delta){
		this.last += delta;
		var len = engine.entities.length;
		var en;
		var think = false;
		if(this.last  >= 100){
			think = true;
			this.last = 0;
		}
		for(var i=0; i<len; i++){

			en = engine.entities[i];
			//console.log(en)
			if(en.isActive()){
				en.update(delta);
				if(think){
					en.think(delta);
				}
			}
		}
	}
};

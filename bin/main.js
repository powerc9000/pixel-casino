(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//     __  __         __           _
//    / / / /__  ____ _____/ /  ____  ____         (_)____
//   / /_/ / _ \/ __ `/ __  /_____/ __ \/ __ \    / / ___/
//  / __  /  __/ /_/ / /_/ /_____/ /_/ / / / /   / (__  )
// /_/ /_/\___/\__,_/\__,_/      \____/_/ /_(_)_/ /____/
//                         /___/
(function(window, undefined){
  "use strict";
  var headOn = (function(){

    var headOn = {

        groups: {},
        _images: {},
        fps: 50,
        imagesLoaded: true,
        gameTime: 0,
        _update:"",
        _render:"",
        _ticks: 0,

        randInt: function(min, max) {
          return Math.floor(Math.random() * (max +1 - min)) + min;
        },
        randFloat: function(min, max) {
          return Math.random() * (max - min) + min;
        },
        events: {
          events: {},
          listen: function(eventName, callback){
            var id = headOn.uId();
            if(!this.events[eventName]){
              this.events[eventName] = [];
            }
            this.events[eventName].push({cb:callback, id:id});
          },
          unlisten:function(eventName, id){
            if(!this.events[eventName]) return;
            this.events[eventName].forEach(function(e, i){
              if(e.id === id){
                this.events[eventName].splice(i,1);
              }
            });
          },
          trigger: function(eventName){
            var args = [].splice.call(arguments, 1),
              e = this.events[eventName],
              l,
              i;
            if(e){
              l = e.length;
              for(i = 0; i < l; i++){
                e[i].cb.apply(headOn, args);
              }
            }

          }
        },
        uId: function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
        },
        FSM: function(entity){
          this.entity = entity;
          return this;
        },
        Camera: function(width, height, x, y, zoom){
          this.width = width;
          this.height = height;
          x = x || 0;
          y = y || 0;
          this.position = headOn.Vector(x, y);
          this.dimensions = headOn.Vector(width, height);
          this.center = headOn.Vector(x+width/2, y+height/2);
          this.zoomAmt = zoom || 1;
          return this;
        },
        animate: function(object,keyFrames,callback){
          var that, interval, currentFrame = 0;
          if(!object.animating){
            object.animating = true;
            object.image = keyFrames[0];
            that = this;

            interval = setInterval(function(){
              if(keyFrames.length === currentFrame){
                callback();
                object.animating = false;
                object.image = "";
                clearInterval(interval);
              }
              else{
                currentFrame += 1;
                object.image = keyFrames[currentFrame];
              }
            },1000/this.fps);
          }



        },

        update: function(cb){this._update = cb;},

        render: function(cb){this._render = cb;},

        entity: function(values, parent){
          var i, o, base;
          if (parent && typeof parent === "object") {
            o = Object.create(parent);
          }
          else{
            o = {};
          }
          for(i in values){
            if(values.hasOwnProperty(i)){
              o[i] = values[i];
            }
          }
          return o;
        },
        inherit: function (base, sub) {
          // Avoid instantiating the base class just to setup inheritance
          // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
          // for a polyfill
          sub.prototype = Object.create(base.prototype);
          // Remember the constructor property was set wrong, let's fix it
          sub.prototype.constructor = sub;
          // In ECMAScript5+ (all modern browsers), you can make the constructor property
          // non-enumerable if you define it like this instead
          Object.defineProperty(sub.prototype, 'constructor', {
            enumerable: false,
            value: sub
          });
        },

        extend: function(base, values){
          var i;
          for(i in values){
            if(values.hasOwnProperty(i)){
              base[i] = values[i];
            }
          }
        },
        clone: function (obj) {
          // Handle the 3 simple types, and null or undefined
          if (null === obj || "object" != typeof obj) return obj;
          var copy;
          // Handle Date
          if (obj instanceof Date) {
              copy = new Date();
              copy.setTime(obj.getTime());
              return copy;
          }

          // Handle Array
          if (obj instanceof Array) {
              copy = [];
              for (var i = 0, len = obj.length; i < len; i++) {
                  copy[i] = clone(obj[i]);
              }
              return copy;
          }

          // Handle Object
          if (obj instanceof Object) {
              copy = {};
              for (var attr in obj) {
                  if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
              }
              return copy;
          }

          throw new Error("Unable to copy obj! Its type isn't supported.");
        },
        collides: function(poly1, poly2, center) {
          var points1 = this.getPoints(poly1, center),
            points2 = this.getPoints(poly2, center),
            i = 0,
            l = points1.length,
            j, k = points2.length,
            normal = {
              x: 0,
              y: 0
            },
            length,
            min1, min2,
            max1, max2,
            interval,
            MTV = null,
            MTV2 = null,
            MN = null,
            dot,
            nextPoint,
            currentPoint;

          if(poly1.type === "circle" && poly2.type ==="circle"){
            return circleCircle(poly1, poly2);
          }else if(poly1.type === "circle"){
            return circleRect(poly1, poly2);
          }else if(poly2.type === "circle"){
            return circleRect(poly2, poly1);
          }


          //loop through the edges of Polygon 1
          for (; i < l; i++) {
            nextPoint = points1[(i == l - 1 ? 0 : i + 1)];
            currentPoint = points1[i];

            //generate the normal for the current edge
            normal.x = -(nextPoint[1] - currentPoint[1]);
            normal.y = (nextPoint[0] - currentPoint[0]);

            //normalize the vector
            length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            normal.x /= length;
            normal.y /= length;

            //default min max
            min1 = min2 = -1;
            max1 = max2 = -1;

            //project all vertices from poly1 onto axis
            for (j = 0; j < l; ++j) {
              dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
              if (dot > max1 || max1 === -1) max1 = dot;
              if (dot < min1 || min1 === -1) min1 = dot;
            }

            //project all vertices from poly2 onto axis
            for (j = 0; j < k; ++j) {
              dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
              if (dot > max2 || max2 === -1) max2 = dot;
              if (dot < min2 || min2 === -1) min2 = dot;
            }

            //calculate the minimum translation vector should be negative
            if (min1 < min2) {
              interval = min2 - max1;

              normal.x = -normal.x;
              normal.y = -normal.y;
            } else {
              interval = min1 - max2;
            }

            //exit early if positive
            if (interval >= 0) {
              return false;
            }

            if (MTV === null || interval > MTV) {
              MTV = interval;
              MN = {
                x: normal.x,
                y: normal.y
              };
            }
          }

          //loop through the edges of Polygon 2
          for (i = 0; i < k; i++) {
            nextPoint = points2[(i == k - 1 ? 0 : i + 1)];
            currentPoint = points2[i];

            //generate the normal for the current edge
            normal.x = -(nextPoint[1] - currentPoint[1]);
            normal.y = (nextPoint[0] - currentPoint[0]);

            //normalize the vector
            length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            normal.x /= length;
            normal.y /= length;

            //default min max
            min1 = min2 = -1;
            max1 = max2 = -1;

            //project all vertices from poly1 onto axis
            for (j = 0; j < l; ++j) {
              dot = points1[j][0] * normal.x + points1[j][1] * normal.y;
              if (dot > max1 || max1 === -1) max1 = dot;
              if (dot < min1 || min1 === -1) min1 = dot;
            }

            //project all vertices from poly2 onto axis
            for (j = 0; j < k; ++j) {
              dot = points2[j][0] * normal.x + points2[j][1] * normal.y;
              if (dot > max2 || max2 === -1) max2 = dot;
              if (dot < min2 || min2 === -1) min2 = dot;
            }

            //calculate the minimum translation vector should be negative
            if (min1 < min2) {
              interval = min2 - max1;

              normal.x = -normal.x;
              normal.y = -normal.y;
            } else {
              interval = min1 - max2;


            }

            //exit early if positive
            if (interval >= 0) {
              return false;
            }

            if (MTV === null || interval > MTV) MTV = interval;
            if (interval > MTV2 || MTV2 === null) {
              MTV2 = interval;
              MN = {
                x: normal.x,
                y: normal.y
              };
            }
          }

          return {
            overlap: MTV2,
            normal: MN
          };
          function circleRect(circle, rect){
            var newX = circle.position.x * Math.cos(-rect.angle);
            var newY = circle.position.y * Math.sin(-rect.angle);
            var circleDistance = {x:newX, y:newY};
            var cornerDistance_sq;
            circleDistance.x = Math.abs(circle.position.x - rect.position.x);
              circleDistance.y = Math.abs(circle.position.y - rect.position.y);

              if (circleDistance.x > (rect.width/2 + circle.radius)) { return false; }
              if (circleDistance.y > (rect.height/2 + circle.radius)) { return false; }

              if (circleDistance.x <= (rect.width/2)) { return true; }
              if (circleDistance.y <= (rect.height/2)) { return true; }

              cornerDistance_sq = Math.pow(circleDistance.x - rect.width/2,2) +
                                   Math.pow(circleDistance.y - rect.height/2, 2);

              return (cornerDistance_sq <= Math.pow(circle.radius,2));
          }
          function pointInCircle(point, circle){
            return Math.pow(point.x - circle.position.x ,2) + Math.pow(point.y - circle.position.y, 2) < Math.pow(circle.radius,2);
          }
          function circleCircle(ob1, ob2){
            return square(ob2.position.x - ob1.position.x) + square(ob2.position.y - ob1.position.y) <= square(ob1.radius + ob2.radius);
          }
        },

        getPoints: function (obj, center){
          if(obj.type === "circle"){
            return [];
          }
          var x = obj.position.x,
            y = obj.position.y,
            width = obj.width,
            height = obj.height,
            angle = obj.angle,
            that = this,
            h,
            w,
            points = [];
          if(!center){
            points[0] = [x,y];
            points[1] = [];
            points[1].push(Math.sin(-angle) * height + x);
            points[1].push(Math.cos(-angle) * height + y);
            points[2] = [];
            points[2].push(Math.cos(angle) * width + points[1][0]);
            points[2].push(Math.sin(angle) * width + points[1][1]);
            points[3] = [];
            points[3].push(Math.cos(angle) * width + x);
            points[3].push(Math.sin(angle) * width + y);
          }else{
            w = (width/2);
            h = (height/2);
            points[0] = [x-w, y-h];
            points[1] = [x+w, y-h];
            points[2] = [x+w, y+h];
            points[3] = [x-w, y+h];
          }

            //console.log(points);
          return points;

        },

        Timer: function(){
          this.jobs = [];
        },
        pause: function(){
          this.paused = true;
          this.events.trigger("pause");
        },
        unpause: function(){
          this.events.trigger("unpause");
          this.paused = false;
        },
        isPaused: function(){
          return this.paused;
        },
        group: function(groupName, entity){
          if(this.groups[groupName]){
            if(entity){
              this.groups[groupName].push(entity);
            }
          }
          else{
            this.groups[groupName] = [];
            if(entity){
              this.groups[groupName].push(entity);
            }
          }
          return this.groups[groupName];
        },

        loadImages: function(imageArray, progress, allCallback){
          var args, img, total, loaded, timeout, interval, that, cb, imgOnload;
          that = this;
          this.imagesLoaded = false;
          total = imageArray.length;
          if(!total){
            this.imagesLoaded = true;
          }
          loaded = 0;
          imgOnload = function(){
            loaded += 1;
            progress && progress(loaded, total);
            if(loaded === total){
              allCallback && allCallback();
              that.imagesLoaded = true;
            }
          };
          imageArray.forEach(function(image){
            img = new Image();
            img.src = image.src;
            img.onload = imgOnload;

            that._images[image.name] = img;
          });
        },
        images: function(image){
          if(this._images[image]){
            return this._images[image];
          }
          else{
            return new Image();
          }
        },


        timeout: function(cb, time, scope){
          setTimeout(function(){
            cb.call(scope);
          }, time);
        },

        interval: function(cb, time, scope){
          return setInterval(function(){
            cb.call(scope);
          }, time);
        },
        canvas: function(name){
          if(this === headOn){
            return new this.canvas(name);
          }
          this.canvas = this.canvases[name];
          this.width = this.canvas.width;
          this.height = this.canvas.height;
          return this;
        },

        Vector: function(x, y){
          if(this === headOn){
            return new headOn.Vector(x,y);
          }
          if(typeof x !== "number"){
            if(x){
              this.x = x.x;
              this.y = x.y;
            }else{
              this.x = 0;
              this.y = 0;
            }

          }else{
            this.x = x;
            this.y = y;
          }
          return this;
        },
        run: function(){
          var that = this;
          var then = Date.now();
          var ltime;
          window.requestAnimationFrame(aniframe);
          setTimeout(updateFrame, 1000/this.fps);
          function updateFrame(){
            ltime = then;
            if(that.imagesLoaded){
              then = Date.now();
              that.updateTick(ltime);
            }
            setTimeout(updateFrame, 1000/that.fps);
          }
          function aniframe(){
            //We want the time inbetween frames not the time in between frames + time it took to do a frame
            that.renderTick();
            window.requestAnimationFrame(aniframe);
          }

        },
        updateTick: function(then){
          var now = Date.now(),
          modifier = now - then;
          this.trueFps = 1/(modifier/1000);
          this._ticks+=1;
          this._update(modifier, this._ticks);
          this.gameTime += modifier;

        },
        renderTick: function(then){
          this._render();
        },
        exception: function(message){
          this.message = message;
          this.name = "Head-on Exception";
          this.toString = function(){
            return this.name + ": " + this.message;
          };
        }
    };

    headOn.canvas.create = function(name, width, height, camera, styles){
      var canvas, ctx;
      if(!camera || !(camera instanceof headOn.Camera)){
        throw new headOn.exception("Canvas must be intialized with a camera");
      }
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      if(styles){
        for(var key in styles){
          if(styles.hasOwnProperty(key)){
            canvas.style[key] = styles[key];
          }
        }
      }

      ctx = canvas.getContext("2d");
      this.prototype.canvases[name] = {
        canvas: canvas,
        ctx: ctx,
        width: canvas.width,
        height: canvas.height,
        camera: camera
      };
      return headOn.canvas(name);
    };
    headOn.canvas.prototype = {
      canvases: {},
      stroke: function(stroke){
        var ctx = this.canvas.ctx;
        ctx.save();
        if(stroke){
          ctx.lineWidth = stroke.width;
          ctx.strokeStyle = stroke.color;
          ctx.stroke();
        }
        ctx.restore();
      },
      drawRect: function(width, height, x, y, color, stroke, rotation){
        var ctx = this.canvas.ctx, mod = 1, camera = this.canvas.camera;
        var obj;
        if(arguments.length === 1 && typeof arguments[0] === "object"){
          obj = arguments[0];
          x = obj.x;
          y = obj.y;
          width = obj.width;
          height = obj.height;
          color = obj.color;
          stroke = obj.stroke;
          rotation = obj.rotation;
        }
        
        ctx.save();
        ctx.beginPath();

        if(rotation){
          ctx.translate(x,y);
          ctx.rotate(rotation);
          ctx.rect(0, 0, width, height);
        }
        else{
          //console.log(camera.position.x)
          if(obj && obj.camera === false){
            ctx.rect(x, y, width, height);
          }else{
            ctx.rect((x - camera.position.x)/camera.zoomAmt , (y - camera.position.y)/camera.zoomAmt , width / camera.zoomAmt, height / camera.zoomAmt);
          }
          
        }
        if(color){
          ctx.fillStyle = color;
        }

        ctx.fill();
        if(typeof stroke === "object" && !isEmpty(stroke)){
          this.stroke(stroke);
        }
        ctx.closePath();
        ctx.restore();
        return this;
      },
      drawCircle: function(x, y, radius, color, stroke){
        var ctx = this.canvas.ctx, mod = 1, camera = this.canvas.camera, oneArg;
        if(arguments.length === 1 && typeof arguments[0] === "object"){
          oneArg = true;
          x=arguments[0].x;
          y=arguments[0].y;
          radius=arguments[0].radius;
          color = arguments[0].color;
          stroke = arguments[0].stroke;
        }
        
        ctx.save();
        ctx.beginPath();
        if(oneArg && arguments[0].camera === false){
          ctx.arc(x, y, radius, 0, 2*Math.PI, false);
        }else{

          ctx.arc((x - camera.position.x)/camera.zoomAmt, (y - camera.position.y)/camera.zoomAmt, radius / camera.zoomAmt, 0, 2*Math.PI, false);
        }
        
        ctx.fillStyle = color || "black";
        ctx.fill();
        this.stroke(stroke);
        ctx.restore();
        ctx.closePath();
        return this;
      },
      drawImage: function(image,x,y){
        var ctx = this.canvas.ctx;
        var camera = this.canvas.camera;
        var coords = camera.unproject(headOn.Vector(x,y));
        try{
          ctx.drawImage(image,coords.x,coords.y);
        }
        catch(e){
          console.log(image);
        }
        return this;
      },
      drawLine: function(start, end, color){
        var ctx = this.canvas.ctx;
        var camera = this.canvas.camera;
        start = camera.unproject(start);
        end = camera.unproject(end);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
      },
      drawImageRotated: function(image, rotation, x,y){
        var ctx = this.canvas.ctx;
        var radians = rotation * Math.PI / 180;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(radians);
        ctx.drawImage(image, 0-image.width, 0-image.height);
        ctx.restore();
        return this;
      },
      createGradient: function(options){
        var grd;
        var ctx = this.canvas.ctx;
        var camera = this.canvas.camera;
        var start;
        var end;
        if(options.camera !== false){
          start = camera.unproject(options.start);
          end = camera.unproject(options.end);
        }else{
          start = options.start;
          end = options.end;
        }
        if(options.type === "radial"){
          return ctx.createRadialGradient(start.x, start.y, options.radius1, end.x, end.y, options.radius2);
        }else{
          return ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        }
        
      },
      drawText: function(textString, x, y, fontStyle, color, alignment, baseline){
        var ctx = this.canvas.ctx;
        ctx.save();

        if(fontStyle){
          ctx.font = fontStyle + " sans-serif";
        }
        if(color){
          ctx.fillStyle = color;
        }
        if(alignment){
          ctx.textAlign = alignment;
        }
        if(baseline){
          ctx.textBaseline = baseline;
        }

        ctx.fillText(textString,x,y);

        ctx.restore();
        return this;
      },

      append: function(element){
        element = document.querySelector(element);
        if(element){
          this.canvas.canvas = element.appendChild(this.canvas.canvas);
        }
        else{
          this.canvas.canvas = document.body.appendChild(this.canvas.canvas);
        }
        return this;
      },
      clear: function(){
        var ctx = this.canvas.ctx;
        ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
      },
      setCamera: function(cam){
        this.canvas.camera = cam;
      }
    };
    headOn.FSM.prototype = {
      changeState: function(state){
        if(this.state){
          this.state.exit();
        }
           
        this.state = state;
        this.state.enter();
      },
      update: function(){
        var args = [].slice.call(arguments, 0);
        args.unshift(this.entity);
        this.state.execute.apply(null, args);  
      },
      setState: function(state){
        this.state = state;
      }
    },
    headOn.Timer.prototype = {
      job: function(time, start){
        var jiff = {
          TTL: time,
          remaining: start || time
        };
        this.jobs.push(jiff);
        return {
          ready: function(){
            return jiff.remaining <= 0;
          },
          reset: function(){
            jiff.remaining = jiff.TTL;
          },
          timeLeft: function(){
            return jiff.remaining;
          }
        };
      },
      update: function(time){
        this.jobs.forEach(function(j){
          j.remaining -= time;
        });
      }
    };
    headOn.Camera.prototype = {
      zoomIn: function(amt){
        this.zoomAmt /= amt;
        this.position = this.center.sub(this.dimensions.mul(this.zoomAmt / 2));
        return this;
      },
      zoomOut: function(amt){
        this.zoomAmt *= amt;
        this.position = this.center.sub(this.dimensions.mul(this.zoomAmt / 2));

        return this;
      },
      move: function(vec){
        this.position = this.position.add(vec);
        this.center = this.position.add(headOn.Vector(this.width, this.height).mul(0.5));
        headOn.events.trigger("cameraMoved", this);
        return this;
      },
      inView: function(vec){
        if(vec.x >= this.position.x && vec.x <= this.position.x + this.width *this.zoomAmt && vec.y >= this.position.y && vec.y <= this.position.y + this.height*this.zoomAmt){
          return true;
        }else{
          return false;
        }
      },
      moveTo: function(vec){
        this.position = vec.sub(this.dimensions.mul(0.5).mul(this.zoomAmt));
        headOn.events.trigger("cameraMoved", this);
        this.center = vec;
      },
      project: function(vec){
        return vec.mul(this.zoomAmt).add(this.position);
      },
      unproject: function(vec){
        return vec.mul(1/this.zoomAmt).sub(this.position);
      }
    };
    headOn.Vector.prototype = {
      normalize: function(){
        var len = this.length();
        if(len === 0){
          return headOn.Vector(0,0);
        }
        return headOn.Vector(this.x/len, this.y/len);
      },

      normalizeInPlace: function(){
        var len = this.length();
        this.x /= len;
        this.y /= len;
      },
      distance: function(vec2){
        return this.sub(vec2).length();
      },
      dot: function(vec2){
        return vec2.x * this.x + vec2.y * this.y;
      },

      length: function(){
        return Math.sqrt(this.x*this.x + this.y*this.y);
      },

      sub: function(vec2){
        return headOn.Vector(this.x - vec2.x, this.y - vec2.y);
      },

      add: function(vec2){
        return headOn.Vector(this.x + vec2.x, this.y + vec2.y);
      },
      truncate: function(max){
        var i;
        i = max / this.length();
        i = i < 1 ? i : 1;
        return this.mul(i);
      },
      mul: function(scalar){
        return headOn.Vector(this.x * scalar, this.y * scalar);
      }
    };
    function sign(num){
      if(num < 0){
        return -1;
      }else{
        return 1;
      }
    }


    return headOn;
    function square(num){
      return num * num;
    }
    function isEmpty(obj){
      return Object.keys(obj).length === 0;
    }
  }());
  module.exports = headOn;
  window.headOn = headOn;
})(window);
},{}],2:[function(require,module,exports){
(function(){
	var config = {
		NUM_OF_RAYS: 1000
	}

	if(window.DEBUG){
		window.config = config;
	}

	module.exports = config
}())

},{}],3:[function(require,module,exports){
var $h = require("../lib/headOn.js");
var utls = require("./utils.js");
(function(){
	function engine(){
		if ( engine.prototype._singletonInstance ) {
		    return engine.prototype._singletonInstance;
		}
		engine.prototype._singletonInstance = this;
		return this;
	}

	engine.prototype.getInstance = function(){
		return this.instance;
	}
	engine.prototype.init = function(width, height){
		this.levels = {};
		this.everything = {};
		this.gameWidth = width;
		this.gameHeight = height;
		this.camera = new $h.Camera(width, height);
		this.mainCanvas = $h.canvas.create("main", width, height, this.camera);
		this.mainCanvas.append("body");
	}
	engine.prototype.registerLevel = function(name, leveldata) {
		// body...
		var id = utils.UUID();
		leveldata.ID = id;
		this.levels[name] = leveldata;
		this.everything[id] = this.levels[name];
	};
	engine.prototype.loadLevel = function(levelname) {
		var level = this.everything[levelname] || this.levels[levelname];
		this.currentLevel = level;
	};
	var instance = new engine();
	module.exports = engine;
}())
},{"../lib/headOn.js":1,"./utils.js":6}],4:[function(require,module,exports){
var $h = require("../lib/headOn.js");
var engine = require("./engine.js")();
var Class = require("./utils.js").Class;
var Light = require("./light");
var ray = require("./utils").ray;
engine.init(window.innerWidth, window.innerHeight);
var map = {
	get:function(x,y){
		x = Math.floor(x/this.size);
		y = Math.floor(y/this.size);
		//console.log(x,y);
		if(y>=this.data.length|| x>=this.data[0].length || x<0 || y<0) return -1;
		return this.data[y][x];
	},
	size:16,
	length:10,
	width:30,
	data:[
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
	]
}
engine.mainCanvas.drawRect(window.innerWidth, window.innerHeight, 0,0, "black");

var light = new Light(20,20, 100);
var tileSize = 16;
var mul = 1;
$h.update(function(delta){
	//console.log(delta);
	light.position.x += 100 * (delta / 1000) * mul;
	if(light.position.x > 400){
		mul = -1;
	}
	if(light.position.x < 17){
		mul = 1;
	}
})
$h.render(function(){
	engine.mainCanvas.drawRect(window.innerWidth, window.innerHeight, 0,0, "black");
	for(var y=0; y<map.length; y++){
		for(var x = 0; x<map.width; x++){
			if(map.data[y][x]){
				engine.mainCanvas.drawRect(16,16, x*16, y*16, "red");
			}
		}
	}
	light.render(engine.mainCanvas, map);
	//console.log(ray(20,20, 50,50, map))

})

$h.run();




},{"../lib/headOn.js":1,"./engine.js":3,"./light":5,"./utils":6,"./utils.js":6}],5:[function(require,module,exports){
var $h = require("../lib/headOn");
var ray = require("./utils").ray;
var config = require("./config");
function Light(x, y, radius, sector, angle, color){
	this.position = new $h.Vector(x, y);
	this.radius = radius;
	if(!x || !y || !radius){
		this.render = false;
		console.warn("Lights need x y and radius specified");
	}
	this.sector = sector || Math.PI * 2;
	this.angle = angle || 0;
	this.color = color || "white"
}
module.exports = Light;
Light.prototype = {
	render: function(canvas, map){
		if(this.render === false) return;
		var NUM_OF_RAYS = config.NUM_OF_RAYS;
		var ctx = canvas.canvas.ctx;
		var i;
		var s;
		var a = this.angle;
		var amt = (this.sector)/NUM_OF_RAYS;
		var p;
		var end;
		var t;
		var p2x;
		var p2y;

		//Start a path
		ctx.beginPath();
		ctx.moveTo(this.position.x, this.position.y);
		//Loop through all the angles that the light needs
		//console.log(this, this.position.x, a, this.radius);
		for(i=0; i<NUM_OF_RAYS; i++, a+=amt){
			//find the end point of a line from that angle
			p2x = this.position.x + Math.cos(a) * this.radius;
			p2y = this.position.y + Math.sin(a) * this.radius;
			//go along path to find walls.
			p = ray(this.position.x,this.position.y, p2x, p2y, map);

			if(i===0) end = p;
			//make a line to where it found a wall or the end of the path
			ctx.lineTo(p.x, p.y);
		}
		//if its a full circle we need to end where we started or there will be a small peice missing
		//if it isnt a full circle we need to end where the lights position is so we get a nice cone shape
		if(this.sector === Math.PI * 2){
			ctx.lineTo(end.x,end.y);
		}else{
			ctx.lineTo(this.position.x, this.position.y);
		}
		ctx.fillStyle = this.color;
		ctx.fill();
	}

}
},{"../lib/headOn":1,"./config":2,"./utils":6}],6:[function(require,module,exports){
$h = require("../lib/headOn.js");
exports.UUID = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

exports.ray = function(x0, y0, x1, y1, map){
	var dx = Math.abs(x1-x0);
	var dy = Math.abs(y1-y0);
	var xo = x0;
	var yo = y0;
	var sx = (x0 < x1) ? 1 : -1;
	var sy = (y0 < y1) ? 1 : -1;
	var err = ~~dx-dy;
	x1 = ~~x1;
	y1 = ~~y1;
	 var m
	//console.log(x0,x1,y0,y1)
	 //var count = 0;
	while(true){
	   m = map.get(x0, y0);
	   if(m === 1 || m === -1) break;
	   if (Math.abs(x0-x1) <= 2 && Math.abs(y0-y1) <=2) break;
	   var e2 = 2*err;
	   if (e2 >-dy){ err -= dy; x0  += sx; }
	   if (e2 < dx){ err += dx; y0  += sy;}
	   //count++;
	   //console.log(count);
	   //if(count > 50) break;
	}
	return {x:x0, y:y0};
}

exports.Class = function(constructor, parent, members){
	if(!members){
		members = parent;
		parent = false;
	}

	if(parent){
		$h.inherit(parent, constructor);
	}

	$h.extend(constructor.prototype, members);

}

if (!Object.is) {
  Object.is = function(v1, v2) {
    if (v1 === 0 && v2 === 0) {
      return 1 / v1 === 1 / v2;
    }
    if (v1 !== v1) {
      return v2 !== v2;
    }
    return v1 === v2;
  };
}
},{"../lib/headOn.js":1}]},{},[4])
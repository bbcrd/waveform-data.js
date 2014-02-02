!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.WaveformData=e():"undefined"!=typeof global?global.WaveformData=e():"undefined"!=typeof self&&(self.WaveformData=e())}(function(){var define,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/**
 * ArrayBuffer adapter consumes binary waveform data (data format version 1).
 * It is used as a data abstraction layer by `WaveformData`.
 *
 * This is supposed to be the fastest adapter ever:
 * * **Pros**: working directly in memory, everything is done by reference (including the offsetting)
 * * **Cons**: binary data are hardly readable without data format knowledge (and this is why this adapter exists).
 *
 * Also, it is recommended to use the `fromResponseData` factory.
 *
 * @see WaveformDataArrayBufferAdapter.fromResponseData
 * @param {DataView} response_data
 * @constructor
 */
var WaveformDataArrayBufferAdapter = module.exports = function WaveformDataArrayBufferAdapter(response_data){
  this.data = response_data;
};

/**
 * Detects if a set of data is suitable for the ArrayBuffer adapter.
 * It is used internally by `WaveformData.create` so you should not bother using it.
 *
 * @static
 * @param {Mixed} data
 * @returns {boolean}
 */
WaveformDataArrayBufferAdapter.isCompatible = function isCompatible(data){
  return data && typeof data === "object" && "byteLength" in data;
};

/**
 * Setup factory to create an adapter based on heterogeneous input formats.
 *
 * It is the preferred way to build an adapter instance.
 *
 * ```javascript
 * var arrayBufferAdapter = WaveformData.adapters.arraybuffer;
 * var xhr = new XMLHttpRequest();
 *
 * // .dat file generated by audiowaveform program
 * xhr.open("GET", "http://example.com/waveforms/track.dat");
 * xhr.responseType = "arraybuffer";
 * xhr.addEventListener("load", function onResponse(progressEvent){
 *  var responseData = progressEvent.target.response;
 *
 *  // doing stuff with the raw data ...
 *  // you only have access to WaveformDataArrayBufferAdapter API
 *  var adapter = arrayBufferAdapter.fromResponseData(responseData);
 *
 *  // or making things easy by using WaveformData ...
 *  // you have access WaveformData API
 *  var waveform = new WaveformData(responseData, arrayBufferAdapter);
 * });
 *
 * xhr.send();
 * ```

 * @static
 * @param {ArrayBuffer} response_data
 * @return {WaveformDataArrayBufferAdapter}
 */
WaveformDataArrayBufferAdapter.fromResponseData = function fromArrayBufferResponseData(response_data){
  return new WaveformDataArrayBufferAdapter(new DataView(response_data));
};

/**
 * @namespace WaveformDataArrayBufferAdapter
 */
WaveformDataArrayBufferAdapter.prototype = {
  /**
   * Returns the data format version number.
   *
   * @return {Integer} Version number of the consumed data format.
   */
  get version(){
    return this.data.getInt32(0, true);
  },
  /**
   * Indicates if the response body is encoded in 8bits.
   *
   * **Notice**: currently the adapter only deals with 8bits encoded data.
   * You should favor that too because of the smaller data network fingerprint.
   *
   * @return {boolean} True if data are declared to be 8bits encoded.
   */
  get is_8_bit(){
    return !!this.data.getUint32(4, true);
  },
  /**
   * Indicates if the response body is encoded in 16bits.
   *
   * @return {boolean} True if data are declared to be 16bits encoded.
   */
  get is_16_bit(){
    return !this.is_8_bit;
  },
  /**
   * Returns the number of samples per second.
   *
   * @return {Integer} Number of samples per second.
   */
  get sample_rate(){
    return this.data.getInt32(8, true);
  },
  /**
   * Returns the scale (number of samples per pixel).
   *
   * @return {Integer} Number of samples per pixel.
   */
  get scale(){
    return this.data.getInt32(12, true);
  },
  /**
   * Returns the length of the waveform data (number of data points).
   *
   * @return {Integer} Length of the waveform data.
   */
  get length(){
    return this.data.getUint32(16, true);
  },
  /**
   * Returns a value at a specific offset.
   *
   * @param {Integer} index
   * @return {number} waveform value
   */
  at: function at_sample(index){
    return Math.round(this.data.getInt8(20 + index));
  }
};

},{}],2:[function(require,module,exports){
"use strict";

module.exports = {
  "arraybuffer": require("./arraybuffer.js"),
  "object": require("./object.js")
};
},{"./arraybuffer.js":1,"./object.js":3}],3:[function(require,module,exports){
"use strict";

/**
 * Object adapter consumes stringified JSON or JSON waveform data (data format version 1).
 * It is used as a data abstraction layer by `WaveformData`.
 *
 * This is supposed to be a fallback for browsers not supporting ArrayBuffer:
 * * **Pros**: easy to debug response_data and quite self describing.
 * * **Cons**: slower than ArrayBuffer, more memory consumption.
 *
 * Also, it is recommended to use the `fromResponseData` factory.
 *
 * @see WaveformDataObjectAdapter.fromResponseData
 * @param {String|Object} response_data JSON or stringified JSON
 * @constructor
 */
var WaveformDataObjectAdapter = module.exports = function WaveformDataObjectAdapter(response_data){
  this.data = response_data;
};

/**
 * Detects if a set of data is suitable for the Object adapter.
 * It is used internally by `WaveformData.create` so you should not bother using it.
 *
 * @static
 * @param {Mixed} data
 * @returns {boolean}
 */
WaveformDataObjectAdapter.isCompatible = function isCompatible(data){
  return data && (typeof data === "object" && "sample_rate" in data) || (typeof data === "string" && "sample_rate" in JSON.parse(data));
};

/**
 * Setup factory to create an adapter based on heterogeneous input formats.
 *
 * It is the preferred way to build an adapter instance.
 *
 * ```javascript
 * var objectAdapter = WaveformData.adapters.object;
 * var xhr = new XMLHttpRequest();
 *
 * // .dat file generated by audiowaveform program
 * xhr.open("GET", "http://example.com/waveforms/track.json");
 * xhr.responseType = "json";
 * xhr.addEventListener("load", function onResponse(progressEvent){
 *  var responseData = progressEvent.target.response;
 *
 *  // doing stuff with the raw data ...
 *  // you only have access to WaveformDataObjectAdapter API
 *  var adapter = objectAdapter.fromResponseData(responseData);
 *
 *  // or making things easy by using WaveformData ...
 *  // you have access WaveformData API
 *  var waveform = new WaveformData(responseData, objectAdapter);
 * });
 *
 * xhr.send();
 * ```

 * @static
 * @param {String|Object} response_data JSON or stringified JSON
 * @return {WaveformDataObjectAdapter}
 */
WaveformDataObjectAdapter.fromResponseData = function fromJSONResponseData(response_data){
  if (typeof response_data === "string"){
    return new WaveformDataObjectAdapter(JSON.parse(response_data));
  }
  else{
    return new WaveformDataObjectAdapter(response_data);
  }
};
/**
 * @namespace WaveformDataObjectAdapter
 */
WaveformDataObjectAdapter.prototype = {
  /**
   * Returns the data format version number.
   *
   * @return {Integer} Version number of the consumed data format.
   */
  get version(){
    return this.data.version || 1;
  },
  /**
   * Indicates if the response body is encoded in 8bits.
   *
   * **Notice**: currently the adapter only deals with 8bits encoded data.
   * You should favor that too because of the smaller data network fingerprint.
   *
   * @return {boolean} True if data are declared to be 8bits encoded.
   */
  get is_8_bit(){
    return this.data.bits === 8;
  },
  /**
   * Indicates if the response body is encoded in 16bits.
   *
   * @return {boolean} True if data are declared to be 16bits encoded.
   */
  get is_16_bit(){
    return !this.is_8_bit;
  },
  /**
   * Returns the number of samples per second.
   *
   * @return {Integer} Number of samples per second.
   */
  get sample_rate(){
    return this.data.sample_rate;
  },
  /**
   * Returns the scale (number of samples per pixel).
   *
   * @return {Integer} Number of samples per pixel.
   */
  get scale(){
    return this.data.samples_per_pixel;
  },
  /**
   * Returns the length of the waveform data (number of data points).
   *
   * @return {Integer} Length of the waveform data.
   */
  get length(){
    return this.data.length;
  },
  /**
   * Returns a value at a specific offset.
   *
   * @param {Integer} index
   * @return {number} waveform value
   */
  at: function at_sample(index){
    return Math.round(this.data.data[index]);
  }
};

},{}],4:[function(require,module,exports){
"use strict";

var WaveformDataSegment = require("./segment.js");

/**
 * Facade to iterate on audio waveform response.
 *
 * ```javascript
 *  var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
 *
 *  var json_waveform = new WaveformData(xhr.responseText, WaveformData.adapters.object);
 *
 *  var arraybuff_waveform = new WaveformData(getArrayBufferData(), WaveformData.adapters.arraybuffer);
 * ```
 *
 * ## Offsets
 *
 * An **offset** is a non-destructive way to iterate on a subset of data.
 *
 * It is the easiest way to **navigate** through data without having to deal with complex calculations.
 * Simply iterate over the data to display them.
 *
 * *Notice*: the default offset is the entire set of data.
 *
 * @param {String|ArrayBuffer|Mixed} response_data Waveform data, to be consumed by the related adapter.
 * @param {WaveformData.adapter|Function} adapter Backend adapter used to manage access to the data.
 * @constructor
 */
var WaveformData = module.exports = function WaveformData(response_data, adapter){
  /**
   * Backend adapter used to manage access to the data.
   *
   * @type {Object}
   */
  this.adapter = adapter.fromResponseData(response_data);

  /**
   * Defined segments.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   *
   * console.log(waveform.segments.speakerA);          // -> undefined
   *
   * waveform.set_segment(30, 90, "speakerA");
   *
   * console.log(waveform.segments.speakerA.start);    // -> 30
   * ```
   *
   * @type {Object} A hash of `WaveformDataSegment` objects.
   */
  this.segments = {};

  this.offset(0, this.adapter.length);
};

/**
 * Creates an instance of WaveformData by guessing the adapter from the data type.
 * As an icing sugar, it will also do the detection job from an XMLHttpRequest response.
 *
 * ```javascript
 * var xhr = new XMLHttpRequest();
 * xhr.open("GET", "http://example.com/waveforms/track.dat");
 * xhr.responseType = "arraybuffer";
 *
 * xhr.addEventListener("load", function onResponse(progressEvent){
 *   var waveform = WaveformData.create(progressEvent.target);
 *
 *   console.log(waveform.duration);
 * });
 *
 * xhr.send();
 * ```
 *
 * @static
 * @throws TypeError
 * @param {XMLHttpRequest|Mixed} data
 * @return {WaveformData}
 */
WaveformData.create = function createFromResponseData(data){
  var adapter = null;
  var xhrData = null;

  if (data && typeof data === "object" && "response" in data){
    xhrData = ("responseType" in data) ? data.response : (data.responseText || data.response);
  }

  Object.keys(WaveformData.adapters).some(function(adapter_id){
    if (WaveformData.adapters[adapter_id].isCompatible(xhrData || data)){
      adapter = WaveformData.adapters[adapter_id];
      return true;
    }
  });

  if (adapter === null){
    throw new TypeError("Could not detect a WaveformData adapter from the input.");
  }

  return new WaveformData(xhrData || data, adapter);
};

/**
 * Public API for the Waveform Data manager.
 *
 * @namespace WaveformData
 */
WaveformData.prototype = {
  /**
   * Clamp an offset of data upon the whole response body.
   * Pros: it's just a reference, not a new array. So it's fast.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.offset_length);   // -> 150
   * console.log(waveform.min[0]);          // -> -12
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.min.length);      // -> 30
   * console.log(waveform.min[0]);          // -> -9
   * ```
   *
   * @param {Integer} start New beginning of the offset. (inclusive)
   * @param {Integer} end New ending of the offset (exclusive)
   */
  offset: function(start, end){
    var data_length = this.adapter.length;

    if (end < 0){
      throw new RangeError("End point must be non-negative.");
    }

    if (end <= start){
      throw new RangeError("We can't end prior to the starting point.");
    }

    if (start < 0){
      throw new RangeError("Start point must be non-negative.");
    }

    if (start >= data_length){
      throw new RangeError("Start point must be within range.");
    }

    if (end > data_length){
      end = data_length;
    }

    this.offset_start = start;
    this.offset_end = end;
    this.offset_length = end - start;
  },
  /**
   * Creates a new segment of data.
   * Pretty handy if you need to bookmark a duration and display it according to the current offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(Object.keys(waveform.segments));          // -> []
   *
   * waveform.set_segment(10, 120);
   * waveform.set_segment(30, 90, "speakerA");
   *
   * console.log(Object.keys(waveform.segments));          // -> ['default', 'speakerA']
   * console.log(waveform.segments.default.min.length);    // -> 110
   * console.log(waveform.segments.speakerA.min.length);   // -> 60
   * ```
   *
   * @param {Integer} start Beginning of the segment (inclusive)
   * @param {Integer} end Ending of the segment (exclusive)
   * @param {String*} identifier Unique identifier. If nothing is specified, *default* will be used as a value.
   * @return {WaveformDataSegment}
   */
  set_segment: function setSegment(start, end, identifier){
    identifier = identifier || "default";

    this.segments[identifier] = new WaveformDataSegment(this, start, end);

    return this.segments[identifier];
  },
  /**
   * Creates a new WaveformData object with resampled data.
   * Returns a rescaled waveform, to either fit the waveform to a specific width, or to a specific zoom level.
   *
   * **Note**: You may specify either the *width* or the *scale*, but not both. The `scale` will be deduced from the `width` you want to fit the data into.
   *
   * Adapted from Sequence::GetWaveDisplay in Audacity, with permission.
   *
   * ```javascript
   * // ...
   * var waveform = WaveformData.create({ ... });
   *
   * // fitting the data in a 500px wide canvas
   * var resampled_waveform = waveform.resample({ width: 500 });
   *
   * console.log(resampled_waveform.min.length);   // -> 500
   *
   * // zooming out on a 3 times less precise scale
   * var resampled_waveform = waveform.resample({ scale: waveform.adapter.scale * 3 });
   *
   * // partial resampling (to perform fast animations involving a resampling per animation frame)
   * var partially_resampled_waveform = waveform.resample({ width: 500, from: 0, to: 500 });
   *
   * // ...
   * ```
   *
   * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/Sequence.cpp
   * @param {Number|{width: Number, scale: Number}} options Either a constraint width or a constraint sample rate
   * @return {WaveformData} New resampled object
   */
  resample: function(options){
    if (typeof options === 'number'){
      options = { width: options };
    }

    var output_data = [];
    var samples_per_pixel = options.scale || Math.floor(this.duration * this.adapter.sample_rate / options.width);    //scale we want to reach
    var scale = this.adapter.scale;   //scale we are coming from

    var start_sample_input_index = 0;
    var start_sample_output_index = 0;

    if (options.start_time) {
      start_sample_input_index = Math.floor(options.start_time * this.adapter.sample_rate / this.adapter.scale);
      start_sample_output_index = Math.floor(options.start_time * this.adapter.sample_rate / samples_per_pixel);
    }

    //console.log("start_sample_input_index", start_sample_input_index, "start_sample_output_index", start_sample_output_index, "Start Time", options.start_time);
    //console.log("input_index", options.input_index, "output_index", options.output_index, "start_time", options.testStartTime);

    var input_buffer_size = this.adapter.length; //the amount of data we want to resample i.e. final zoom want to resample all data but for intermediate zoom we want to resample subset
    var min = input_buffer_size ? this.min_sample(/*start_sample_input_index*/options.input_index) : 0; //min value for peak in waveform
    var max = input_buffer_size ? this.max_sample(/*start_sample_input_index*/options.input_index) : 0; //max value for peak in waveform
    var input_index = /*start_sample_input_index || 0;*/options.input_index || 0; //is this start point? or is this the index at current scale
    var output_index = /*start_sample_output_index || 0;*/options.output_index || 0; //is this end point? or is this the index at scale we want to be?
    var min_value = -128; 
    var max_value = 127;

    if (samples_per_pixel < scale){
      throw new Error("Zoom level "+samples_per_pixel+" too low, minimum: "+scale);
    }

    var where, prev_where, stop, value, last_input_index;

    var sample_at_pixel = function sample_at_pixel(x){
      return Math.floor(x * samples_per_pixel);
    };

    var add_sample = function add_sample(min, max){
      output_data.push(min, max);
    };

    while (input_index < input_buffer_size) {
      while (Math.floor(sample_at_pixel(output_index) / scale) <= input_index){
        if (output_index){
          add_sample(min, max);
        }

        last_input_index = input_index;

        output_index++;

        where      = sample_at_pixel(output_index);
        prev_where = sample_at_pixel(output_index - 1);

        if (where !== prev_where){
          min = max_value;
          max = min_value;
        }
      }

      where = sample_at_pixel(output_index);
      stop = Math.floor(where / scale);

      if (stop > input_buffer_size){
        stop = input_buffer_size;
      }

      while (input_index < stop){
        value = this.min_sample(input_index);

        if (value < min){
          min = value;
        }

        value = this.max_sample(input_index);

        if (value > max){
          max = value;
        }

        input_index++;
      }

      if (options.length) {
        if ((output_data.length/2) >= options.length) {
          break;
        }
      }
    }

    if ((output_data.length/2) > options.length) {
      if(input_index !== last_input_index){
        add_sample(min, max);
      }
    }

    return new WaveformData({
      version: this.adapter.version,
      samples_per_pixel: samples_per_pixel,
      length: output_data.length / 2,
      data: output_data,
      sample_rate: this.adapter.sample_rate
    }, WaveformData.adapters.object);
  },
  /**
   * Returns all the min peaks values.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.min.length);      // -> 150
   * console.log(waveform.min[0]);          // -> -12
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.min.length);      // -> 30
   * console.log(waveform.min[0]);          // -> -9
   * ```
   *
   * @api
   * @return {Array.<Integer>} Min values contained in the offset.
   */
  get min(){
    return this.offsetValues(this.offset_start, this.offset_length, 0);
  },
  /**
   * Returns all the max peaks values.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.max.length);      // -> 150
   * console.log(waveform.max[0]);          // -> 12
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.max.length);      // -> 30
   * console.log(waveform.max[0]);          // -> 5
   * ```
   *
   * @api
   * @return {Array.<Integer>} Max values contained in the offset.
   */
  get max(){
    return this.offsetValues(this.offset_start, this.offset_length, 1);
  },
  /**
   * Return the unpacked values for a particular offset.
   *
   * @param {Integer} start
   * @param {Integer} length
   * @param {Integer} correction The step to skip for each iteration (as the response body is [min, max, min, max...])
   * @return {Array.<Integer>}
   */
  offsetValues: function getOffsetValues(start, length, correction){
    var adapter = this.adapter;

    //creating a dense array on the fly for an optimized loop
    //@see http://www.2ality.com/2012/06/dense-arrays.html
    var values = Array.apply(null, new Array(length));

    correction += (start * 2);  //offsetting the positioning query

    return values.map(function offsetValueMapper(val, i){
      return adapter.at((i * 2) + correction);
    });
  },
  /**
   * Compute the duration in seconds of the audio file.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   * console.log(waveform.duration);    // -> 10.33333333333
   *
   * waveform.offset(20, 50);
   * console.log(waveform.duration);    // -> 10.33333333333
   * ```
   *
   * @api
   * @return {number} Duration of the audio waveform, in seconds.
   */
  get duration(){
    return (this.adapter.length * this.adapter.scale) / this.adapter.sample_rate;
  },
  /**
   * Return the duration in seconds of the current offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.offset_duration);    // -> 10.33333333333
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.offset_duration);    // -> 2.666666666667
   * ```
   *
   * @api
   * @return {number} Duration of the offset, in seconds.
   */
  get offset_duration(){
    return (this.offset_length * this.adapter.scale) / this.adapter.sample_rate;
  },
  /**
   * Return the number of pixels per second.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.pixels_per_second);       // -> 93.75
   * ```
   *
   * @api
   * @return {number} Number of pixels per second.
   */
  get pixels_per_second(){
    return this.adapter.sample_rate / this.adapter.scale;
  },
  /**
   * Return the amount of time represented by a single pixel.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.seconds_per_pixel);       // -> 0.010666666666666666
   * ```
   *
   * @return {number} Amount of time (in seconds) contained in a pixel.
   */
  get seconds_per_pixel(){
    return this.adapter.scale / this.adapter.sample_rate;
  },
  /**
   * Returns a value at a specific offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.at(20));              // -> -7
   * console.log(waveform.at(21));              // -> 12
   * ```
   *
   * @proxy
   * @param {Integer} index
   * @return {number} Offset value
   */
  at: function at_sample_proxy(index){
    return this.adapter.at(index);
  },
  /**
   * Return the pixel location for a certain time.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.at_time(0.0000000023));       // -> 10
   * ```
   * @param {number} time
   * @return {integer} Index location for a specific time.
   */
  at_time: function at_time(time){
    return Math.floor((time * this.adapter.sample_rate) / this.adapter.scale);
  },
  /**
   * Returns the time in seconds for a particular index
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.time(10));                    // -> 0.0000000023
   * ```
   *
   * @param {Integer} index
   * @return {number}
   */
  time: function time(index){
    return index * this.seconds_per_pixel;
  },
  /**
   * Return if a pixel lies within the current offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.in_offset(50));      // -> true
   * console.log(waveform.in_offset(120));     // -> true
   *
   * waveform.offset(100, 150);
   *
   * console.log(waveform.in_offset(50));      // -> false
   * console.log(waveform.in_offset(120));     // -> true
   * ```
   *
   * @param {number} pixel
   * @return {boolean} True if the pixel lies in the current offset, false otherwise.
   */
  in_offset: function isInOffset(pixel){
    return pixel >= this.offset_start && pixel < this.offset_end;
  },
  /**
   * Returns a min value for a specific offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.min_sample(10));      // -> -7
   * ```
   *
   * @param {Integer} offset
   * @return {Number} Offset min value
   */
  min_sample: function getMinValue(offset){
    return this.adapter.at(offset * 2);
  },
  /**
   * Returns a max value for a specific offset.
   *
   * ```javascript
   * var waveform = WaveformData.create({ ... });
   *
   * console.log(waveform.max_sample(10));      // -> 12
   * ```
   *
   * @param {Integer} offset
   * @return {Number} Offset max value
   */
  max_sample: function getMaxValue(offset){
    return this.adapter.at((offset * 2) + 1);
  }
};

/**
 * Available adapters to manage the data backends.
 *
 * @type {Object}
 */
WaveformData.adapters = {};


/**
 * WaveformData Adapter Structure
 *
 * @typedef {{from: Number, to: Number, platforms: {}}}
 */
WaveformData.adapter = function WaveformDataAdapter(response_data){
  this.data = response_data;
};

},{"./segment.js":5}],5:[function(require,module,exports){
"use strict";

/**
 * Segments are an easy way to keep track of portions of the described audio file.
 *
 * They return values based on the actual offset. Which means if you change your offset and:
 *
 * * a segment becomes **out of scope**, no data will be returned;
 * * a segment is only **partially included in the offset**, only the visible parts will be returned;
 * * a segment is **fully included in the offset**, its whole content will be returned.
 *
 * Segments are created with the `WaveformData.set_segment(from, to, name?)` method.
 *
 * @see WaveformData.prototype.set_segment
 * @param {WaveformData} context WaveformData instance
 * @param {Integer} start Initial start index
 * @param {Integer} end Initial end index
 * @constructor
 */
var WaveformDataSegment = module.exports = function WaveformDataSegment(context, start, end){
  this.context = context;

  /**
   * Start index.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.start);  // -> 10
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.start);  // -> 10
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.start);  // -> 10
   * ```
   * @type {Integer} Initial starting point of the segment.
   */
  this.start = start;

  /**
   * End index.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.end);  // -> 50
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.end);  // -> 50
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.end);  // -> 50
   * ```
   * @type {Integer} Initial ending point of the segment.
   */
  this.end = end;
};

/**
 * @namespace WaveformDataSegment
 */
WaveformDataSegment.prototype = {
  /**
   * Dynamic starting point based on the WaveformData instance offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.offset_start);  // -> 10
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.offset_start);  // -> 20
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.offset_start);  // -> null
   * ```
   *
   * @return {number} Starting point of the segment within the waveform offset. (inclusive)
   */
  get offset_start(){
    if (this.start < this.context.offset_start && this.end > this.context.offset_start){
      return this.context.offset_start;
    }

    if (this.start >= this.context.offset_start && this.start < this.context.offset_end){
      return this.start;
    }

    return null;
  },
  /**
   * Dynamic ending point based on the WaveformData instance offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.offset_end);  // -> 50
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.offset_end);  // -> 50
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.offset_end);  // -> null
   * ```
   *
   * @return {number} Ending point of the segment within the waveform offset. (exclusive)
   */
  get offset_end(){
    if (this.end > this.context.offset_start && this.end <= this.context.offset_end){
      return this.end;
    }

    if (this.end > this.context.offset_end && this.start < this.context.offset_end){
      return this.context.offset_end;
    }

    return null;
  },
  /**
   * Dynamic segment length based on the WaveformData instance offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.offset_length);  // -> 40
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.offset_length);  // -> 30
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.offset_length);  // -> 0
   * ```
   *
   * @return {number} Visible length of the segment within the waveform offset.
   */
  get offset_length(){
    return this.offset_end - this.offset_start;
  },
  /**
   * Initial length of the segment.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.length);  // -> 40
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.length);  // -> 40
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.length);  // -> 40
   * ```
   *
   * @return {number} Initial length of the segment.
   */
  get length(){
    return this.end - this.start;
  },
  /**
   * Indicates if the segment has some visible part in the actual WaveformData offset.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.visible);        // -> true
   *
   * waveform.offset(20, 50);
   * console.log(waveform.segments.example.visible);        // -> true
   *
   * waveform.offset(70, 100);
   * console.log(waveform.segments.example.visible);        // -> false
   * ```
   *
   * @return {Boolean} True if at least partly visible, false otherwise.
   */
  get visible(){
    return this.context.in_offset(this.start) || this.context.in_offset(this.end) || (this.context.offset_start > this.start && this.context.offset_start < this.end);
  },
  /**
   * Return the minimum values for the segment.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.min.length);        // -> 40
   * console.log(waveform.segments.example.min.offset_length); // -> 40
   * console.log(waveform.segments.example.min[0]);            // -> -12
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.segments.example.min.length);        // -> 40
   * console.log(waveform.segments.example.min.offset_length); // -> 30
   * console.log(waveform.segments.example.min[0]);            // -> -5
   * ```
   *
   * @return {Array.<Integer>} Min values of the segment.
   */
  get min(){
    return this.visible ? this.context.offsetValues(this.offset_start, this.offset_length, 0) : [];
  },
  /**
   * Return the maximum values for the segment.
   *
   * ```javascript
   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
   * waveform.set_segment(10, 50, "example");
   *
   * console.log(waveform.segments.example.max.length);        // -> 40
   * console.log(waveform.segments.example.max.offset_length); // -> 40
   * console.log(waveform.segments.example.max[0]);            // -> 5
   *
   * waveform.offset(20, 50);
   *
   * console.log(waveform.segments.example.max.length);        // -> 40
   * console.log(waveform.segments.example.max.offset_length); // -> 30
   * console.log(waveform.segments.example.max[0]);            // -> 11
   * ```
   *
   * @return {Array.<Integer>} Max values of the segment.
   */
  get max(){
    return this.visible ? this.context.offsetValues(this.offset_start, this.offset_length, 1) : [];
  }
};
},{}],6:[function(require,module,exports){
"use strict";

var WaveformData = require("./lib/core");
WaveformData.adapters = require("./lib/adapters");

module.exports = WaveformData;
},{"./lib/adapters":2,"./lib/core":4}]},{},[6])
(6)
});
;
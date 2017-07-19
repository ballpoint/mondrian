import consts from 'consts';
import Bounds from 'geometry/bounds';
import Path from 'geometry/path';
import Text from 'geometry/text';
import Item from 'geometry/item';
import Group from 'geometry/group';
import UUIDV4 from 'uuid/v4';

let io = {

  parse(container) {
    let results = [];
    for (let elem of container.childNodes) {

      // <defs> symbols... for now we don't do much with this.
      if (elem.nodeName === "defs") {
        continue;
        let inside = this.parse(elem);
        results = results.concat(inside);

      // <g> group tags... drill down.
      } else if (elem.nodeName === "g") {
        results.push(new Group(this.parse(elem)));
      } else {

        // Otherwise it must be a shape element we have a class for.
        let parsed = this.parseElement(elem);

        if (parsed === false) {
          continue;
        }

        // Any geometric shapes
        if (parsed instanceof Item) {
          results.push(parsed);

        // <use> tag
        } else if (parsed instanceof Object && (parsed["xlink:href"] != null)) {
          parsed.reference = true;
          results.push(parsed);
        }
      }
    }

    let monsvgs = results.filter(e => e instanceof Item);

    return results;
  },


  findSVGRoot(input) {
    if (input instanceof Array) {
      return input[0].$rep.closest("svg");
    } else if (input instanceof $) {
      input = input.filter('svg');
      if (input.is("svg")) {
        return input;
      } else {
        let $svg = input.find("svg");
        if ($svg.length === 0) {
          throw new Error("io: No svg node found.");
        } else {
          return $svg[0];
        }
      }
    } else {
      return this.findSVGRoot($(input));
    }
  },


  parseElement(elem) {
    let attrs = elem.attributes;

    let transform = null;
    for (let key of Object.keys(attrs || {})) {
      let attr = attrs[key];
      if (attr.name === "transform") {
        transform = attr.value;
      }
    }

    let data = this.makeData(elem);
    let type = elem.nodeName.toLowerCase();
    let result;

    switch (type) {
      case 'text':
        result = new Text(data);
        result.setContent(elem.textContent);
        break;
      case 'path':
        result = new Path(data);
        break;
      case 'rect':
        result = Path.rectangle(data);
        break;
      case 'ellipse':
        result = Path.ellipse(data);
        break;
      case 'circle':
        data.rx = data.r;
        data.ry = data.r;
        delete data.r;
        result = Path.ellipse(data);
        break;
      case 'polyline':
        result = Path.polyline(data);
        break;
      case 'polygon':
        result = Path.polygon(data);
        break;
      default:
        // TODO handle these
        return null;
        break;
    }

    if (result) {
      if (transform && (type !== "text")) {
        result.carryOutTransformations(transform);
        delete result.data.transform;
        result.commit();
      }

      return result;
    }
  },

  makeData(elem) {
    let blacklist = ["inkscape", "sodipodi", "uuid"];

    let blacklistCheck = function(key) {
      for (let x of Array.from(blacklist)) {
        if (key.indexOf(x) > -1) {
          return false;
        }
      }
      return true;
    };

    let attrs = elem.attributes;
    let data = {};

    for (let key in attrs) {
      let val = attrs[key];
      key = val.name;
      val = val.value;
      if (key === "") { continue; }

      // Don't keep style attributes. Carry them out.
      // style should only be used for temporary transformations,
      // not permanent ones.
      if ((key === "style") && (elem.nodeName !== "text")) {
        data = this.applyStyles(data, val);
      } else if ((val != null) && blacklistCheck(key)) {
        if (/^\d+$/.test(val)) {
          val = parseFloat(val);
        }
        data[key] = val;
      }
    }


    /*
    if (data.id === undefined) {
      data.id = UUIDV4(); 
    }
    */

    // By now any transform attrs should be permanent
    //elem.removeAttribute("transform")

    return data;
  },

  applyStyles(data, styles) {
    let blacklist = ["display", "transform"];
    styles = styles.split(";");
    for (let style of Array.from(styles)) {
      style = style.split(":");
      let key = style[0];
      let val = style[1];
      if (blacklist.has(key)) { continue; }
      data[key] = val;
    }
    return data;
  },


  parseAndAppend(input, makeNew) {
    let parsed = this.parse(input, makeNew);
    parsed.map(elem => elem.appendTo('#main'));
    ui.refreshAfterZoom();
    return parsed;
  },


  prepareForExport() {
    return (() => {
      let result = [];
      for (let elem of Array.from(ui.elements)) {
        if (elem.type === "path") {
          if (elem.virgin != null) {
            elem.virginMode();
          }
        }
        result.push((typeof elem.cleanUpPoints === 'function' ? elem.cleanUpPoints() : undefined));
      }
      return result;
    })();
  },


  cleanUpAfterExport() {
    return (() => {
      let result = [];
      for (let elem of Array.from(ui.elements)) {
        let item;
        if (elem.type === "path") {
          if (elem.virgin != null) {
            item = elem.editMode();
          }
        }
        result.push(item);
      }
      return result;
    })();
  },

  createSVGElement(type) {
    return document.createElementNS(consts.svgNamespace, type);
  },

  itemToElement(item) {
    if (item instanceof Path) {
      let elem = this.createSVGElement('path');
      for (let key in item.data) {
        item.commitData();
        elem.setAttribute(key, item.data[key]);
      }
      return elem;
    } else {
      console.warn('Cannot transform to element:', item);
    }
  },

  makeFile() {
    this.prepareForExport();

    // Get the file
    let main = new XMLSerializer().serializeToString(dom.main);

    this.cleanUpAfterExport();

    // Newlines! This is hacky.
    // Make better whitespace management happen later
    main = main.replace(/>/gi, ">\n");

    // Attributes to never export, for internal use at runtime only
    let blacklist = ["uuid"];

    for (let attr of Array.from(blacklist)) {
      main = main.replace(new RegExp(attr + '\\=\\"\[\\d\\w\]*\\"', 'gi'), '');
    }

    // Return the file with a comment in the beginning
    // linking to Mondy
    return `\
<!-- Made in Mondrian.io -->
${main}\
`;
  },

  makeBase64() {
    return btoa(this.makeFile());
  },

  makeBase64URI() {
    return `data:image/svg+xml;charset=utf-8;base64,${this.makeBase64()}`;
  }
};

export default io;

import * as config from "../config.json";
import lowdb from "lowdb";
import Base from "lowdb/adapters/Base";

let BoxGlob = {};
function importAll(r) {
  r.keys().forEach((key) => {
    let keyName = key.replace("./", "").replace(".js", "");
    BoxGlob[keyName] = r(key);
  });
}

importAll(require.context("./boxes", true, /\.js$/));

// from "./boxes/*.js";

class Memory extends Base {
  read() {
    return this.defaultValue;
  }
  write() {}
}
let adapter = new Memory();
export const db = lowdb(adapter);

window.StreamInput = (val) => {
  db.setState(val).write();

  window.dispatchEvent(
    new CustomEvent("refresh-state", { detail: db.getState() })
  );

  if (val && val.boxes) {
    val.boxes
      .filter((b) => b)
      .forEach((b) => {
        window.dispatchEvent(
          new CustomEvent("box-refresh" + b._id, { detail: b })
        );
      });
  }
};

const onReadyState = (cb) => {
  let tt = setInterval(() => {
    let state = db.getState();
    if (state && state.boxes && state.cables) {
      clearTimeout(tt);
      cb();
    }
  });
};

function MyCore({ mounter }) {
  let globalsMap = new Map();
  let resources = {
    get: (name) => {
      return new Promise((resolve) => {
        let tt = setInterval(() => {
          if (globalsMap.has(name)) {
            clearInterval(tt);
            resolve(globalsMap.get(name));
          }
        });
      });
    },
    set: async (name, val) => {
      globalsMap.set(name, val);
      return val;
    },
  };

  let setupEachBox = ({ box, boxes, cables }) => {
    let stream = (nameOrIDX, cb) => {
      let inputs = box.inputs;

      let input = inputs[nameOrIDX];

      if (!input) {
        input = inputs.find((e) => e.nameOrIDX === nameOrIDX);
      }

      if (input) {
        let onStream = ({ detail }) => {
          cb(detail);
        };
        window.addEventListener(input._id, onStream);
        // eventBus.on(input._id, cb);
        return () => {
          window.removeEventListener(input._id, onStream);
          // eventBus.off(input._id, cb);
        };
      } else {
        console.log(box.moduleName, "not found input of", nameOrIDX);
        return () => {
          console.log(box.moduleName, "not found input of", nameOrIDX);
        };
      }
    };

    let pulse = (data) => {
      let outCables = cables.filter((c) => c.outputBoxID === box._id);
      outCables.forEach((cable) => {
        // eventBus.emit(cable.inputSlotID, data);
        window.dispatchEvent(
          new CustomEvent(cable.inputSlotID, { detail: data })
        );
      });
    };

    let onUserData = (cb) => {
      let hh = ({ detail }) => {
        let box = detail;
        let userData = box.userData;
        let args = {};
        userData.forEach((e) => {
          args[e.name] = e.value;
        });
        cb(args);
      };

      window.addEventListener("box-refresh" + box._id, hh);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("box-refresh" + box._id, { detail: box })
        );
      }, 1);
      window.dispatchEvent(
        new CustomEvent("request-input-stream", { detail: box })
      );
      return () => {
        window.removeEventListener("box-refresh" + box._id, hh);
      };
    };
    if (BoxGlob[box.moduleName] && BoxGlob[box.moduleName].box) {
      BoxGlob[box.moduleName].box({
        onUserData,
        resources,
        domElement: mounter,
        pulse,
        stream,
        log: (v) => {
          console.log(JSON.stringify(v, null, 4));
        },
        graph: lowdb,
      });
    }
  };

  let runAllModules = () => {
    let boxes = db.getState().boxes;
    let cables = db.getState().cables;

    for (let box of boxes) {
      if (box) {
        setupEachBox({ box, boxes, cables });
        console.log("Setup:  " + box.moduleName);
      }
    }
    console.log("Setup: All Done.");
  };

  runAllModules();
  return;
}

export async function main({ mounter }) {
  if (process.env.NODE_ENV === "production") {
    let meta = require("./meta.json");
    db.setState(meta).write();
  }
  if (process.env.NODE_ENV === "development") {
    let io = require("socket.io-client");

    let socketServer = config.studio.appleLocal;

    await fetch(socketServer, { mode: "no-cors" }).catch((e) => {
      socketServer = config.studio.socketServer;
    });

    let socket = io(socketServer);

    socket.on("stream-state", ({ state }) => {
      if (window.StreamInput) {
        window.StreamInput(state);
      }
      console.log("receive-state");
    });

    socket.on("reload-page", () => {
      setTimeout(() => {
        window.location = window.location.href;
      });
    });

    window.addEventListener("request-input-stream", () => {
      socket.emit("request-input-stream", {});
    });
    socket.emit("request-input-stream", {});
  }

  onReadyState(() => {
    MyCore({ mounter });
  });
}

export const onExport = (v) => {
  window.addEventListener("export-object-3d", v);
};

export default main;
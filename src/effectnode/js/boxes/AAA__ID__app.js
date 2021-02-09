/*
BoxScripts[box.moduleName].box({
  resources,
  domElement: mounter,
  pulse,
  inputAt,
  log: (v) => {
    console.log(JSON.stringify(v, null, 4));
  },
  graph: lowdb,
});
*/

import ReactDOM from "react-dom";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

function DynamicRoot({ relay }) {
  let [routes, addRoutes] = useState([]);

  useEffect(() => {
    relay.pulse({
      type: "mount",
      done: (v) => {
        addRoutes((s) => {
          if (v) {
            return [
              ...s,
              <Route key={`_route_` + Math.random()} path={v.path}>
                {v.react}
              </Route>,
            ];
          } else {
            return [...s];
          }
        });
      },
    });
  }, []);

  return (
    <Router>
      <Switch>{routes}</Switch>
    </Router>
  );
}

export const box = ({ domElement, ...relay }) => {
  // ReactDOM.render(
  //   <Canvas
  //     colorManagement={true}
  //     pixelRatio={window.devicePixelRatio || 1.0}
  //     camera={{ position: [0, 0, -50] }}
  //     onCreated={({ gl }) => {
  //       gl.outputEncoding = sRGBEncoding;
  //     }}
  //   >
  //     <Background onUserData={onUserData}></Background>
  //     <EffectNode
  //       scale={[1, 1, 1]}
  //       position={[0, 0, 0]}
  //       tools={{ pulse }}
  //     ></EffectNode>
  //     <OrbitControls />
  //     <ambientLight intensity={1.0} />
  //   </Canvas>,
  //   domElement
  // );

  ReactDOM.render(<DynamicRoot relay={relay}></DynamicRoot>, domElement);
};

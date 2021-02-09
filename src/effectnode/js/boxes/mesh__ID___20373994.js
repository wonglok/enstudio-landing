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

import React, { useRef, useEffect } from "react";
import { useFrame } from "react-three-fiber";
import { Color } from "three";

function GLBox({ relay, position = [0, 0, 0] }) {
  const mesh = useRef();

  // const [hovered, setHover] = useState(false);
  // const [active, setActive] = useState(false);

  useFrame(() => {
    if (mesh.current) {
      if (mesh.current.rotation.rx) {
        mesh.current.rotation.x += mesh.current.rotation.rx;
      }
      if (mesh.current.rotation.ry) {
        mesh.current.rotation.y += mesh.current.rotation.ry;
      }
      if (mesh.current.rotation.rz) {
        mesh.current.rotation.rz += mesh.current.rotation.rz;
      }
    }
  });

  useEffect(() => {
    return relay.onUserData(({ color, rx, ry, rz }) => {
      mesh.current.rotation.rx = rx * 0.0003;
      mesh.current.rotation.ry = ry * 0.0003;
      mesh.current.rotation.rz = rz * 0.0003;
      mesh.current.material.color = new Color(color);
    });
  });

  useEffect(() => {
    relay.pulse({
      type: "geo",
      done: (val) => {
        mesh.current.geometry = val;
      },
    });

    relay.pulse({
      type: "mat",
      done: (val) => {
        mesh.current.material = val;
      },
    });
  }, []);

  return (
    <mesh position={position} ref={mesh} scale={[3, 3, 3]}>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
    </mesh>
  );
}

export const box = async ({ ...relay }) => {
  relay.stream(0, ({ type, done }) => {
    if (type === "mount") {
      done(<GLBox key={"box"} relay={relay}></GLBox>);
    }
  });
};

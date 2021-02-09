import React, { useMemo } from "react";
// import { useFrame } from "react-three-fiber";
import { Noodles } from "../lib/Noodle";

function FuncNode({ tools, position = [0, 0, 0] }) {
  let noodle = useMemo(() => {
    return new Noodles({ tools });
  }, []);

  return <primitive object={noodle.object3d}></primitive>;
}

export const box = async ({ ...tools }) => {
  tools.stream(0, ({ type, done }) => {
    if (type === "mount") {
      done(<FuncNode key={"noodles"} tools={tools}></FuncNode>);
    }
  });
};

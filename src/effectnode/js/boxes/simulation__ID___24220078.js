import React, { useMemo } from "react";
import { useFrame, useThree } from "react-three-fiber";
import { NoodleSimulation } from "../lib/Simulation";

function FuncNode({ tools }) {
  let { gl } = useThree();

  let noodle = useMemo(() => {
    return new NoodleSimulation({ tools, renderer: gl });
  }, []);

  useFrame((state) => {
    noodle.render(state);
  });

  return <primitive object={noodle.object3d}></primitive>;
}

export const box = async ({ ...tools }) => {
  tools.stream(0, ({ type, done }) => {
    if (type === "mount") {
      done(<FuncNode key={"noodles"} tools={tools}></FuncNode>);
    }
  });
};

import React, { useRef, useEffect } from "react";
import { extend, useThree, useFrame } from "react-three-fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass";

extend({
  EffectComposer,
  ShaderPass,
  RenderPass,
  UnrealBloomPass,
  FilmPass,
  AfterimagePass,
});

export default function Effects({ tools }) {
  const composer = useRef();
  const { scene, gl, size, camera } = useThree();
  let dpi = window.devicePixelRatio || 1.0;
  dpi = 1.25;

  const unreal = useRef();
  useEffect(
    () => void composer.current.setSize(size.width * dpi, size.height * dpi),
    [size, dpi]
  );

  useFrame(() => composer.current.render(), 1);

  useEffect(
    () =>
      tools.onUserData(({ threshold, radius, strength }) => {
        unreal.current.threshold = (threshold / 100) * 1.0;
        unreal.current.radius = (radius / 100) * 3;
        unreal.current.strength = (strength / 100) * 3;
      }),
    []
  );

  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      <unrealBloomPass
        ref={unreal}
        attachArray="passes"
        args={[undefined, 1.0, 0.6, 0.55]}
      />
      {/* <afterimagePass attachArray="passes" damp={0.1}></afterimagePass> */}
      {/* <filmPass attachArray="passes"></filmPass> */}
    </effectComposer>
  );
}

export const box = async ({ ...tools }) => {
  tools.stream(0, ({ type, done }) => {
    if (type === "mount") {
      done(<Effects key={"effects"} tools={tools}></Effects>);
    }
  });
};

import React, { useRef, useEffect, useMemo } from "react";
import { extend, useThree, useFrame } from "react-three-fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass";
import {
  Layers,
  MeshBasicMaterial,
  ShaderMaterial,
  sRGBEncoding,
  WebGLRenderTarget,
} from "three";

extend({
  EffectComposer,
  ShaderPass,
  RenderPass,
  UnrealBloomPass,
  FilmPass,
  AfterimagePass,
});

const BLOOM_SCENE = 3;
const BLACK_SCENE = 4;
// const ENTIRE_SCENE = 0;

export default function Effects({ tools }) {
  const bloomComposer = useRef();
  const finalComposer = useRef();
  const { scene, gl, size, camera } = useThree();
  const renderer = gl;

  const unreal = useRef();

  const dpi = (window.devicePixelRatio || 1.0) >= 2.5 ? 2.5 : 1.0;
  useEffect(() => {
    bloomComposer.current.setSize(dpi * size.width, dpi * size.height);
    finalComposer.current.setSize(dpi * size.width, dpi * size.height);
  }, [size]);

  const baseRenderTarget = useMemo(() => {
    return new WebGLRenderTarget(dpi * size.width, dpi * size.height, {
      encoding: sRGBEncoding,
    });
  }, []);

  const finalRTT = useMemo(() => {
    return new WebGLRenderTarget(dpi * size.width, dpi * size.height, {
      encoding: sRGBEncoding,
    });
  }, []);

  const bloomLayer = useMemo(() => {
    const bloomLayer = new Layers();
    bloomLayer.set(BLOOM_SCENE);
    return bloomLayer;
  });

  const blackLayer = useMemo(() => {
    const blackLayer = new Layers();
    blackLayer.set(BLACK_SCENE);
    return blackLayer;
  });

  const materialRestore = {};

  let darkMaterial = useMemo(() => {
    return new MeshBasicMaterial({ color: 0x000000 });
  });

  function darkenNonBloomed(obj) {
    if (obj.material && bloomLayer.test(obj.layers) === false) {
      materialRestore[obj.uuid] = obj.material;

      if (blackLayer.test(obj.layers) === true) {
        obj.material = darkMaterial;
      } else {
        obj.visible = false;
      }
    }
  }

  function restoreMaterial(obj) {
    if (materialRestore[obj.uuid]) {
      obj.material = materialRestore[obj.uuid];
      delete materialRestore[obj.uuid];
      obj.visible = true;
    }
  }

  useFrame(() => {
    // finalPassUniforms.bloomCompositeMix.value = params.bloomCompositeMix;
    // finalPassUniforms.bloomSatuationPower.value = params.bloomSatuationPower;

    camera.layers.enableAll();
    renderer.setRenderTarget(baseRenderTarget);
    renderer.clear();
    renderer.setRenderTarget(baseRenderTarget);
    renderer.render(scene, camera);

    camera.layers.enableAll();

    scene.traverse(darkenNonBloomed);
    if (bloomComposer.current) {
      bloomComposer.current.render();
    }
    scene.traverse(restoreMaterial);
    finalComposer.current.render();

    // bloomComposer.current.render();
  }, 2);

  useEffect(
    () =>
      tools.onUserData(({ threshold, radius, strength }) => {
        unreal.current.threshold = (threshold / 100) * 1.0;
        unreal.current.radius = (radius / 100) * 3;
        unreal.current.strength = (strength / 100) * 3;
      }),
    []
  );

  useEffect(() => {
    const finalPassUniforms = {
      bloomCompositeMix: { value: 1.0 },
      bloomSatuationPower: { value: 2.0 },
      baseTexture: { value: baseRenderTarget.texture },
      bloomTexture: { value: bloomComposer.current.renderTarget2.texture },
    };

    // ctx.onLoop(() => {
    //   finalPassUniforms.bloomCompositeMix.value = params.bloomCompositeMix;
    //   finalPassUniforms.bloomSatuationPower.value = params.bloomSatuationPower;
    // });

    const finalPass = new ShaderPass(
      new ShaderMaterial({
        uniforms: finalPassUniforms,
        vertexShader: /* glsl */ `
      varying vec2 vUv;

			void main() {

				vUv = uv;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}
        `,
        fragmentShader: `
      uniform sampler2D baseTexture;
			uniform sampler2D bloomTexture;

      uniform float bloomCompositeMix;
      uniform float bloomSatuationPower;
			varying vec2 vUv;

			void main() {
        vec2 myUV = vec2(vUv.x, vUv.y);

        // float bloomCompositeMix = 1.0;
        // float bloomSatuationPower = 2.0;

        vec4 bloomColor = texture2D( bloomTexture, myUV );
        bloomColor.r = pow(bloomColor.r, bloomSatuationPower);
        bloomColor.g = pow(bloomColor.g, bloomSatuationPower);
        bloomColor.b = pow(bloomColor.b, bloomSatuationPower);


				gl_FragColor = ( texture2D( baseTexture, myUV ) * 1.0 + 1.0 * vec4( bloomCompositeMix, bloomCompositeMix, bloomCompositeMix, 1.0 ) * bloomColor );
      }
      `,
        defines: {},
      })
    );

    finalComposer.current.addPass(finalPass);

    finalPass.renderToScreen = true;
  });

  return (
    <>
      <effectComposer
        ref={bloomComposer}
        args={[gl, baseRenderTarget]}
        renderToScreen={false}
      >
        <renderPass attachArray="passes" scene={scene} camera={camera} />
        <unrealBloomPass
          ref={unreal}
          attachArray="passes"
          args={[undefined, 1.0, 0.6, 0.55]}
        />
        {/* <afterimagePass attachArray="passes" damp={0.1}></afterimagePass> */}
        {/* <filmPass attachArray="passes"></filmPass> */}
      </effectComposer>
      <effectComposer
        ref={finalComposer}
        args={[gl, finalRTT]}
      ></effectComposer>
    </>
  );
}

export const box = async ({ ...tools }) => {
  tools.stream(0, ({ type, done }) => {
    if (type === "mount") {
      done(<Effects key={"effects"} tools={tools}></Effects>);
    }
  });
};

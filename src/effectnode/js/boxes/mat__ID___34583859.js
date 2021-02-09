import { Clock, MeshStandardMaterial } from "three";

export const box = ({ stream, onUserData, log }) => {
  let onShaderfy = (shader) => {
    let vertHeader = () => {
      return /* glsl */ `
        varying vec2 myUV;
      `;
    };

    let vertexExec = () => {
      return /* glsl */ `
        myUV = uv;
      `;
    };

    let fragHeader = () => {
      return /* glsl */ `
        uniform float res;
        uniform float time;

        varying vec2 myUV;
        const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );

        float noise( in vec2 p ) {
          return sin(p.x)*sin(p.y);
        }

        float fbm4( vec2 p ) {
            float f = 0.0;
            f += 0.5000 * noise( p ); p = m * p * 2.02;
            f += 0.2500 * noise( p ); p = m * p * 2.03;
            f += 0.1250 * noise( p ); p = m * p * 2.01;
            f += 0.0625 * noise( p );
            return f / 0.9375;
        }

        float fbm6( vec2 p ) {
            float f = 0.0;
            f += 0.500000*(0.5 + 0.5 * noise( p )); p = m*p*2.02;
            f += 0.250000*(0.5 + 0.5 * noise( p )); p = m*p*2.03;
            f += 0.125000*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
            f += 0.062500*(0.5 + 0.5 * noise( p )); p = m*p*2.04;
            f += 0.031250*(0.5 + 0.5 * noise( p )); p = m*p*2.01;
            f += 0.015625*(0.5 + 0.5 * noise( p ));
            return f/0.96875;
        }

        float pattern (vec2 p) {
          float vout = fbm4( p + time + fbm6(  p + fbm4( p + time )) );
          return abs(vout);
        }

        vec4 modColor (vec4 gfColor) {
          gfColor *= vec4(
            1.0 - pattern(res * myUV * 3.6 + -0.67 * cos(time * 0.15)),
            1.0 - pattern(res * myUV * 3.6 +  0.0 * cos(time * 0.15)),
            1.0 - pattern(res * myUV * 3.6 +  0.67 * cos(time * 0.15)),
            1.0
          );

          return gfColor;
        }
      `;
    };

    let fragmentExec = () => {
      return /* glsl */ `
        gl_FragColor = modColor(gl_FragColor);
      `;
    };

    shader.uniforms.time = { value: 0 };
    shader.uniforms.res = { value: 0 };

    let clock = new Clock();

    setInterval(() => {
      shader.uniforms.time.value = clock.getElapsedTime();
    });

    // onBoxChange(({ userData }) => {
    //   let value = userData.find((e) => e.name === "res").value;
    //   shader.uniforms.res.value = value / 10.0;
    // });

    onUserData(({ res }) => {
      shader.uniforms.res.value = res / 10.0;
    });

    shader.vertexShader = shader.vertexShader.replace(
      `void main() {`,
      `${vertHeader()}\nvoid main() {`
    );

    shader.vertexShader = shader.vertexShader.replace(
      `void main() {`,
      `void main() {\n${vertexExec()}`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `void main() {`,
      `${fragHeader()}void main() {`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <dithering_fragment>`,
      `#include <dithering_fragment>\n${fragmentExec()}`
    );
  };

  stream(0, ({ type, done }) => {
    if (type === "mat") {
      let material = new MeshStandardMaterial({
        wireframe: true,
      });
      material.onBeforeCompile = onShaderfy;
      done(material);
    }
  });

  return {
    name: "mat",
  };
};

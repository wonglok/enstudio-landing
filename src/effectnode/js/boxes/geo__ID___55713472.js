import { IcosahedronBufferGeometry } from "three";
export const box = ({ stream, onUserData }) => {
  //
  stream(0, ({ type, done }) => {
    if (type === "geo") {
      // done(new IcosahedronBufferGeometry(1, 0));
      onUserData(({ radius }) => {
        done(new IcosahedronBufferGeometry(radius / 10, 2));
      });
    }
  });

  return {
    name: "geo",
  };
};

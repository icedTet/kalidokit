"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcMouth = void 0;
const vector_1 = require("../utils/vector");
const helpers_1 = require("../utils/helpers");
/**
 * Calculate Mouth Shape
 * @param {Array} lm : array of results from tfjs or mediapipe
 */
const calcMouth = (lm) => {
    // eye keypoints
    const eyeInnerCornerL = new vector_1.default(lm[133]);
    const eyeInnerCornerR = new vector_1.default(lm[362]);
    const eyeOuterCornerL = new vector_1.default(lm[130]);
    const eyeOuterCornerR = new vector_1.default(lm[263]);
    // eye keypoint distances
    const eyeInnerDistance = eyeInnerCornerL.distance(eyeInnerCornerR);
    const eyeOuterDistance = eyeOuterCornerL.distance(eyeOuterCornerR);
    // mouth keypoints
    const upperInnerLip = new vector_1.default(lm[13]);
    const lowerInnerLip = new vector_1.default(lm[14]);
    const mouthCornerLeft = new vector_1.default(lm[61]);
    const mouthCornerRight = new vector_1.default(lm[291]);
    // mouth keypoint distances
    const mouthOpen = upperInnerLip.distance(lowerInnerLip);
    const mouthWidth = mouthCornerLeft.distance(mouthCornerRight);
    // mouth open and mouth shape ratios
    // let ratioXY = mouthWidth / mouthOpen;
    let ratioY = mouthOpen / eyeInnerDistance;
    let ratioX = mouthWidth / eyeOuterDistance;
    // normalize and scale mouth open
    ratioY = (0, helpers_1.remap)(ratioY, 0.15, 0.7);
    // normalize and scale mouth shape
    ratioX = (0, helpers_1.remap)(ratioX, 0.45, 0.9);
    ratioX = (ratioX - 0.3) * 2;
    // const mouthX = remap(ratioX - 0.4, 0, 0.5);
    const mouthX = ratioX;
    const mouthY = (0, helpers_1.remap)(mouthOpen / eyeInnerDistance, 0.17, 0.5);
    //Depricated: Change sensitivity due to facemesh and holistic have different point outputs.
    // const fixFacemesh = runtime === "tfjs" ? 1.3 : 0;
    // let ratioI = remap(mouthXY, 1.3 + fixFacemesh * 0.8, 2.6 + fixFacemesh) * remap(mouthY, 0, 1);
    const ratioI = (0, helpers_1.clamp)((0, helpers_1.remap)(mouthX, 0, 1) * 2 * (0, helpers_1.remap)(mouthY, 0.2, 0.7), 0, 1);
    const ratioA = mouthY * 0.4 + mouthY * (1 - ratioI) * 0.6;
    const ratioU = mouthY * (0, helpers_1.remap)(1 - ratioI, 0, 0.3) * 0.1;
    const ratioE = (0, helpers_1.remap)(ratioU, 0.2, 1) * (1 - ratioI) * 0.3;
    const ratioO = (1 - ratioI) * (0, helpers_1.remap)(mouthY, 0.3, 1) * 0.4;
    return {
        x: ratioX || 0,
        y: ratioY || 0,
        shape: {
            A: ratioA || 0,
            E: ratioE || 0,
            I: ratioI || 0,
            O: ratioO || 0,
            U: ratioU || 0,
        },
    };
};
exports.calcMouth = calcMouth;

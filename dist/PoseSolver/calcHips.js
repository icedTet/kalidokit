"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rigHips = exports.calcHips = void 0;
const vector_1 = require("../utils/vector");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("./../constants");
/**
 * Calculates Hip rotation and world position
 * @param {Array} lm3d : array of 3D pose vectors from tfjs or mediapipe
 * @param {Array} lm2d : array of 2D pose vectors from tfjs or mediapipe
 */
const calcHips = (lm3d, lm2d) => {
    //Find 2D normalized Hip and Shoulder Joint Positions/Distances
    const hipLeft2d = vector_1.default.fromArray(lm2d[23]);
    const hipRight2d = vector_1.default.fromArray(lm2d[24]);
    const shoulderLeft2d = vector_1.default.fromArray(lm2d[11]);
    const shoulderRight2d = vector_1.default.fromArray(lm2d[12]);
    const hipCenter2d = hipLeft2d.lerp(hipRight2d, 1);
    const shoulderCenter2d = shoulderLeft2d.lerp(shoulderRight2d, 1);
    const spineLength = hipCenter2d.distance(shoulderCenter2d);
    const hips = {
        position: {
            x: (0, helpers_1.clamp)(hipCenter2d.x - 0.4, -1, 1),
            y: 0,
            z: (0, helpers_1.clamp)(spineLength - 1, -2, 0),
        },
    };
    hips.worldPosition = {
        x: hips.position.x,
        y: 0,
        z: hips.position.z * Math.pow(hips.position.z * -2, 2),
    };
    hips.worldPosition.x *= hips.worldPosition.z;
    hips.rotation = vector_1.default.rollPitchYaw(lm3d[23], lm3d[24]);
    //fix -PI, PI jumping
    if (hips.rotation.y > 0.5) {
        hips.rotation.y -= 2;
    }
    hips.rotation.y += 0.5;
    //Stop jumping between left and right shoulder tilt
    if (hips.rotation.z > 0) {
        hips.rotation.z = 1 - hips.rotation.z;
    }
    if (hips.rotation.z < 0) {
        hips.rotation.z = -1 - hips.rotation.z;
    }
    const turnAroundAmountHips = (0, helpers_1.remap)(Math.abs(hips.rotation.y), 0.2, 0.4);
    hips.rotation.z *= 1 - turnAroundAmountHips;
    hips.rotation.x = 0; //temp fix for inaccurate X axis
    const spine = vector_1.default.rollPitchYaw(lm3d[11], lm3d[12]);
    //fix -PI, PI jumping
    if (spine.y > 0.5) {
        spine.y -= 2;
    }
    spine.y += 0.5;
    //Stop jumping between left and right shoulder tilt
    if (spine.z > 0) {
        spine.z = 1 - spine.z;
    }
    if (spine.z < 0) {
        spine.z = -1 - spine.z;
    }
    //fix weird large numbers when 2 shoulder points get too close
    const turnAroundAmount = (0, helpers_1.remap)(Math.abs(spine.y), 0.2, 0.4);
    spine.z *= 1 - turnAroundAmount;
    spine.x = 0; //temp fix for inaccurate X axis
    return (0, exports.rigHips)(hips, spine);
};
exports.calcHips = calcHips;
/**
 * Converts normalized rotations to radians and estimates world position of hips
 * @param {Object} hips : hip position and rotation values
 * @param {Object} spine : spine position and rotation values
 */
const rigHips = (hips, spine) => {
    //convert normalized values to radians
    if (hips.rotation) {
        hips.rotation.x *= Math.PI;
        hips.rotation.y *= Math.PI;
        hips.rotation.z *= Math.PI;
    }
    spine.x *= constants_1.PI;
    spine.y *= constants_1.PI;
    spine.z *= constants_1.PI;
    return {
        Hips: hips,
        Spine: spine,
    };
};
exports.rigHips = rigHips;

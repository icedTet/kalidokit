"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rigLeg = exports.calcLegs = exports.offsets = void 0;
const vector_1 = require("../utils/vector");
const euler_1 = require("../utils/euler");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("./../constants");
const constants_2 = require("./../constants");
exports.offsets = {
    upperLeg: {
        z: 0.1,
    },
};
/**
 * Calculates leg rotation angles
 * @param {Results} lm : array of 3D pose vectors from tfjs or mediapipe
 */
const calcLegs = (lm) => {
    const rightUpperLegSphericalCoords = vector_1.default.getSphericalCoords(lm[23], lm[25], { x: "y", y: "z", z: "x" });
    const leftUpperLegSphericalCoords = vector_1.default.getSphericalCoords(lm[24], lm[26], { x: "y", y: "z", z: "x" });
    const rightLowerLegSphericalCoords = vector_1.default.getRelativeSphericalCoords(lm[23], lm[25], lm[27], {
        x: "y",
        y: "z",
        z: "x",
    });
    const leftLowerLegSphericalCoords = vector_1.default.getRelativeSphericalCoords(lm[24], lm[26], lm[28], {
        x: "y",
        y: "z",
        z: "x",
    });
    const hipRotation = vector_1.default.findRotation(lm[23], lm[24]);
    const UpperLeg = {
        r: new vector_1.default({
            x: rightUpperLegSphericalCoords.theta,
            y: rightLowerLegSphericalCoords.phi,
            z: rightUpperLegSphericalCoords.phi - hipRotation.z,
        }),
        l: new vector_1.default({
            x: leftUpperLegSphericalCoords.theta,
            y: leftLowerLegSphericalCoords.phi,
            z: leftUpperLegSphericalCoords.phi - hipRotation.z,
        }),
    };
    const LowerLeg = {
        r: new vector_1.default({
            x: -Math.abs(rightLowerLegSphericalCoords.theta),
            y: 0,
            z: 0, // not relevant
        }),
        l: new vector_1.default({
            x: -Math.abs(leftLowerLegSphericalCoords.theta),
            y: 0,
            z: 0, // not relevant
        }),
    };
    //Modify Rotations slightly for more natural movement
    const rightLegRig = (0, exports.rigLeg)(UpperLeg.r, LowerLeg.r, constants_1.RIGHT);
    const leftLegRig = (0, exports.rigLeg)(UpperLeg.l, LowerLeg.l, constants_1.LEFT);
    return {
        //Scaled
        UpperLeg: {
            r: rightLegRig.UpperLeg,
            l: leftLegRig.UpperLeg,
        },
        LowerLeg: {
            r: rightLegRig.LowerLeg,
            l: leftLegRig.LowerLeg,
        },
        //Unscaled
        Unscaled: {
            UpperLeg,
            LowerLeg,
        },
    };
};
exports.calcLegs = calcLegs;
/**
 * Converts normalized rotation values into radians clamped by human limits
 * @param {Object} UpperLeg : normalized rotation values
 * @param {Object} LowerLeg : normalized rotation values
 * @param {Side} side : left or right
 */
const rigLeg = (UpperLeg, LowerLeg, side = constants_1.RIGHT) => {
    const invert = side === constants_1.RIGHT ? 1 : -1;
    const rigedUpperLeg = new euler_1.default({
        x: (0, helpers_1.clamp)(UpperLeg.x, 0, 0.5) * constants_2.PI,
        y: (0, helpers_1.clamp)(UpperLeg.y, -0.25, 0.25) * constants_2.PI,
        z: (0, helpers_1.clamp)(UpperLeg.z, -0.5, 0.5) * constants_2.PI + invert * exports.offsets.upperLeg.z,
        rotationOrder: "XYZ",
    });
    const rigedLowerLeg = new euler_1.default({
        x: LowerLeg.x * constants_2.PI,
        y: LowerLeg.y * constants_2.PI,
        z: LowerLeg.z * constants_2.PI,
    });
    return {
        UpperLeg: rigedUpperLeg,
        LowerLeg: rigedLowerLeg,
    };
};
exports.rigLeg = rigLeg;

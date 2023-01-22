"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rigArm = exports.calcArms = void 0;
const vector_1 = require("../utils/vector");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("./../constants");
const constants_2 = require("./../constants");
/**
 * Calculates arm rotation as euler angles
 * @param {Array} lm : array of 3D pose vectors from tfjs or mediapipe
 */
const calcArms = (lm) => {
    //Pure Rotation Calculations
    const UpperArm = {
        r: vector_1.default.findRotation(lm[11], lm[13]),
        l: vector_1.default.findRotation(lm[12], lm[14]),
    };
    UpperArm.r.y = vector_1.default.angleBetween3DCoords(lm[12], lm[11], lm[13]);
    UpperArm.l.y = vector_1.default.angleBetween3DCoords(lm[11], lm[12], lm[14]);
    const LowerArm = {
        r: vector_1.default.findRotation(lm[13], lm[15]),
        l: vector_1.default.findRotation(lm[14], lm[16]),
    };
    LowerArm.r.y = vector_1.default.angleBetween3DCoords(lm[11], lm[13], lm[15]);
    LowerArm.l.y = vector_1.default.angleBetween3DCoords(lm[12], lm[14], lm[16]);
    LowerArm.r.z = (0, helpers_1.clamp)(LowerArm.r.z, -2.14, 0);
    LowerArm.l.z = (0, helpers_1.clamp)(LowerArm.l.z, -2.14, 0);
    const Hand = {
        r: vector_1.default.findRotation(vector_1.default.fromArray(lm[15]), vector_1.default.lerp(vector_1.default.fromArray(lm[17]), vector_1.default.fromArray(lm[19]), 0.5)),
        l: vector_1.default.findRotation(vector_1.default.fromArray(lm[16]), vector_1.default.lerp(vector_1.default.fromArray(lm[18]), vector_1.default.fromArray(lm[20]), 0.5)),
    };
    //Modify Rotations slightly for more natural movement
    const rightArmRig = (0, exports.rigArm)(UpperArm.r, LowerArm.r, Hand.r, constants_1.RIGHT);
    const leftArmRig = (0, exports.rigArm)(UpperArm.l, LowerArm.l, Hand.l, constants_1.LEFT);
    return {
        //Scaled
        UpperArm: {
            r: rightArmRig.UpperArm,
            l: leftArmRig.UpperArm,
        },
        LowerArm: {
            r: rightArmRig.LowerArm,
            l: leftArmRig.LowerArm,
        },
        Hand: {
            r: rightArmRig.Hand,
            l: leftArmRig.Hand,
        },
        //Unscaled
        Unscaled: {
            UpperArm: UpperArm,
            LowerArm: LowerArm,
            Hand: Hand,
        },
    };
};
exports.calcArms = calcArms;
/**
 * Converts normalized rotation values into radians clamped by human limits
 * @param {Object} UpperArm : normalized rotation values
 * @param {Object} LowerArm : normalized rotation values
 * @param {Object} Hand : normalized rotation values
 * @param {Side} side : left or right
 */
const rigArm = (UpperArm, LowerArm, Hand, side = constants_1.RIGHT) => {
    // Invert modifier based on left vs right side
    const invert = side === constants_1.RIGHT ? 1 : -1;
    UpperArm.z *= -2.3 * invert;
    //Modify UpperArm rotationY  by LowerArm X and Z rotations
    UpperArm.y *= constants_2.PI * invert;
    UpperArm.y -= Math.max(LowerArm.x);
    UpperArm.y -= -invert * Math.max(LowerArm.z, 0);
    UpperArm.x -= 0.3 * invert;
    LowerArm.z *= -2.14 * invert;
    LowerArm.y *= 2.14 * invert;
    LowerArm.x *= 2.14 * invert;
    //Clamp values to human limits
    UpperArm.x = (0, helpers_1.clamp)(UpperArm.x, -0.5, constants_2.PI);
    LowerArm.x = (0, helpers_1.clamp)(LowerArm.x, -0.3, 0.3);
    Hand.y = (0, helpers_1.clamp)(Hand.z * 2, -0.6, 0.6); //side to side
    Hand.z = Hand.z * -2.3 * invert; //up down
    return {
        //Returns Values in Radians for direct 3D usage
        UpperArm: UpperArm,
        LowerArm: LowerArm,
        Hand: Hand,
    };
};
exports.rigArm = rigArm;

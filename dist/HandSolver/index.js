"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandSolver = void 0;
const vector_1 = require("../utils/vector");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("./../constants");
const constants_2 = require("./../constants");
/** Class representing hand solver. */
class HandSolver {
    /**
     * Calculates finger and wrist as euler rotations
     * @param {Array} lm : array of 3D hand vectors from tfjs or mediapipe
     * @param {Side} side: left or right
     */
    static solve(lm, side = constants_1.RIGHT) {
        if (!lm) {
            console.error("Need Hand Landmarks");
            return;
        }
        const palm = [
            new vector_1.default(lm[0]),
            new vector_1.default(lm[side === constants_1.RIGHT ? 17 : 5]),
            new vector_1.default(lm[side === constants_1.RIGHT ? 5 : 17]),
        ];
        const handRotation = vector_1.default.rollPitchYaw(palm[0], palm[1], palm[2]);
        handRotation.y = handRotation.z;
        handRotation.y -= side === constants_1.LEFT ? 0.4 : 0.4;
        let hand = {};
        hand[side + "Wrist"] = { x: handRotation.x, y: handRotation.y, z: handRotation.z };
        hand[side + "RingProximal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[0], lm[13], lm[14]) };
        hand[side + "RingIntermediate"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[13], lm[14], lm[15]) };
        hand[side + "RingDistal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[14], lm[15], lm[16]) };
        hand[side + "IndexProximal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[0], lm[5], lm[6]) };
        hand[side + "IndexIntermediate"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[5], lm[6], lm[7]) };
        hand[side + "IndexDistal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[6], lm[7], lm[8]) };
        hand[side + "MiddleProximal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[0], lm[9], lm[10]) };
        hand[side + "MiddleIntermediate"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[9], lm[10], lm[11]) };
        hand[side + "MiddleDistal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[10], lm[11], lm[12]) };
        hand[side + "ThumbProximal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[0], lm[1], lm[2]) };
        hand[side + "ThumbIntermediate"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[1], lm[2], lm[3]) };
        hand[side + "ThumbDistal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[2], lm[3], lm[4]) };
        hand[side + "LittleProximal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[0], lm[17], lm[18]) };
        hand[side + "LittleIntermediate"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[17], lm[18], lm[19]) };
        hand[side + "LittleDistal"] = { x: 0, y: 0, z: vector_1.default.angleBetween3DCoords(lm[18], lm[19], lm[20]) };
        hand = rigFingers(hand, side);
        return hand;
    }
}
exports.HandSolver = HandSolver;
/**
 * Converts normalized rotation values into radians clamped by human limits
 * @param {Object} hand : object of labeled joint with normalized rotation values
 * @param {Side} side : left or right
 */
const rigFingers = (hand, side = constants_1.RIGHT) => {
    // Invert modifier based on left vs right side
    const invert = side === constants_1.RIGHT ? 1 : -1;
    const digits = ["Ring", "Index", "Little", "Thumb", "Middle"];
    const segments = ["Proximal", "Intermediate", "Distal"];
    hand[side + "Wrist"].x = (0, helpers_1.clamp)(hand[side + "Wrist"].x * 2 * invert, -0.3, 0.3); // twist
    hand[side + "Wrist"].y = (0, helpers_1.clamp)(hand[side + "Wrist"].y * 2.3, side === constants_1.RIGHT ? -1.2 : -0.6, side === constants_1.RIGHT ? 0.6 : 1.6);
    hand[side + "Wrist"].z = hand[side + "Wrist"].z * -2.3 * invert; //left right
    digits.forEach((e) => {
        segments.forEach((j) => {
            const trackedFinger = hand[side + e + j];
            if (e === "Thumb") {
                //dampen thumb rotation depending on segment
                const dampener = {
                    x: j === "Proximal" ? 2.2 : j === "Intermediate" ? 0 : 0,
                    y: j === "Proximal" ? 2.2 : j === "Intermediate" ? 0.7 : 1,
                    z: j === "Proximal" ? 0.5 : j === "Intermediate" ? 0.5 : 0.5,
                };
                const startPos = {
                    x: j === "Proximal" ? 1.2 : j === "Distal" ? -0.2 : -0.2,
                    y: j === "Proximal" ? 1.1 * invert : j === "Distal" ? 0.1 * invert : 0.1 * invert,
                    z: j === "Proximal" ? 0.2 * invert : j === "Distal" ? 0.2 * invert : 0.2 * invert,
                };
                const newThumb = { x: 0, y: 0, z: 0 };
                if (j === "Proximal") {
                    newThumb.z = (0, helpers_1.clamp)(startPos.z + trackedFinger.z * -constants_2.PI * dampener.z * invert, side === constants_1.RIGHT ? -0.6 : -0.3, side === constants_1.RIGHT ? 0.3 : 0.6);
                    newThumb.x = (0, helpers_1.clamp)(startPos.x + trackedFinger.z * -constants_2.PI * dampener.x, -0.6, 0.3);
                    newThumb.y = (0, helpers_1.clamp)(startPos.y + trackedFinger.z * -constants_2.PI * dampener.y * invert, side === constants_1.RIGHT ? -1 : -0.3, side === constants_1.RIGHT ? 0.3 : 1);
                }
                else {
                    newThumb.z = (0, helpers_1.clamp)(startPos.z + trackedFinger.z * -constants_2.PI * dampener.z * invert, -2, 2);
                    newThumb.x = (0, helpers_1.clamp)(startPos.x + trackedFinger.z * -constants_2.PI * dampener.x, -2, 2);
                    newThumb.y = (0, helpers_1.clamp)(startPos.y + trackedFinger.z * -constants_2.PI * dampener.y * invert, -2, 2);
                }
                trackedFinger.x = newThumb.x;
                trackedFinger.y = newThumb.y;
                trackedFinger.z = newThumb.z;
            }
            else {
                //will document human limits later
                trackedFinger.z = (0, helpers_1.clamp)(trackedFinger.z * -constants_2.PI * invert, side === constants_1.RIGHT ? -constants_2.PI : 0, side === constants_1.RIGHT ? 0 : constants_2.PI);
            }
        });
    });
    return hand;
};

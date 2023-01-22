"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcHead = exports.createEulerPlane = void 0;
const vector_1 = require("../utils/vector");
const constants_1 = require("./../constants");
/**
 * Calculate stable plane (triangle) from 4 face landmarks
 * @param {Array} lm : array of results from tfjs or mediapipe
 */
const createEulerPlane = (lm) => {
    //create face detection square bounds
    const p1 = new vector_1.default(lm[21]); //top left
    const p2 = new vector_1.default(lm[251]); //top right
    const p3 = new vector_1.default(lm[397]); //bottom right
    const p4 = new vector_1.default(lm[172]); //bottom left
    const p3mid = p3.lerp(p4, 0.5); // bottom midpoint
    return {
        vector: [p1, p2, p3mid],
        points: [p1, p2, p3, p4],
    };
};
exports.createEulerPlane = createEulerPlane;
/**
 * Calculate roll, pitch, yaw, centerpoint, and rough dimentions of face plane
 * @param {Array} lm : array of results from tfjs or mediapipe
 */
const calcHead = (lm) => {
    // find 3 vectors that form a plane to represent the head
    const plane = (0, exports.createEulerPlane)(lm).vector;
    // calculate roll pitch and yaw from vectors
    const rotate = vector_1.default.rollPitchYaw(plane[0], plane[1], plane[2]);
    // find the center of the face detection box
    const midPoint = plane[0].lerp(plane[1], 0.5);
    // find the dimensions roughly of the face detection box
    const width = plane[0].distance(plane[1]);
    const height = midPoint.distance(plane[2]);
    //flip
    rotate.x *= -1;
    rotate.z *= -1;
    return {
        //defaults to radians for rotation around x,y,z axis
        y: rotate.y * constants_1.PI,
        x: rotate.x * constants_1.PI,
        z: rotate.z * constants_1.PI,
        width: width,
        height: height,
        //center of face detection square
        position: midPoint.lerp(plane[2], 0.5),
        //returns euler angles normalized between -1 and 1
        normalized: {
            y: rotate.y,
            x: rotate.x,
            z: rotate.z,
        },
        degrees: {
            y: rotate.y * 180,
            x: rotate.x * 180,
            z: rotate.z * 180,
        },
    };
};
exports.calcHead = calcHead;

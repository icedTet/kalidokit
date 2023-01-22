"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcBrow = exports.getBrowRaise = exports.calcPupils = exports.calcEyes = exports.stabilizeBlink = exports.pupilPos = exports.eyeLidRatio = exports.getEyeOpen = void 0;
const vector_1 = require("../utils/vector");
const helpers_1 = require("../utils/helpers");
const constants_1 = require("./../constants");
/**
 * Landmark points labeled for eye, brow, and pupils
 */
const points = {
    eye: {
        [constants_1.LEFT]: [130, 133, 160, 159, 158, 144, 145, 153],
        [constants_1.RIGHT]: [263, 362, 387, 386, 385, 373, 374, 380],
    },
    brow: {
        [constants_1.LEFT]: [35, 244, 63, 105, 66, 229, 230, 231],
        [constants_1.RIGHT]: [265, 464, 293, 334, 296, 449, 450, 451],
    },
    pupil: {
        [constants_1.LEFT]: [468, 469, 470, 471, 472],
        [constants_1.RIGHT]: [473, 474, 475, 476, 477],
    },
};
/**
 * Calculate eye open ratios and remap to 0-1
 * @param {Array} lm : array of results from tfjs or mediapipe
 * @param {Side} side : designate left or right
 * @param {Number} high : ratio at which eye is considered open
 * @param {Number} low : ratio at which eye is comsidered closed
 */
const getEyeOpen = (lm, side = constants_1.LEFT, { high = 0.85, low = 0.55 } = {}) => {
    const eyePoints = points.eye[side];
    const eyeDistance = (0, exports.eyeLidRatio)(lm[eyePoints[0]], lm[eyePoints[1]], lm[eyePoints[2]], lm[eyePoints[3]], lm[eyePoints[4]], lm[eyePoints[5]], lm[eyePoints[6]], lm[eyePoints[7]]);
    // human eye width to height ratio is roughly .3
    const maxRatio = 0.285;
    // compare ratio against max ratio
    const ratio = (0, helpers_1.clamp)(eyeDistance / maxRatio, 0, 2);
    // remap eye open and close ratios to increase sensitivity
    const eyeOpenRatio = (0, helpers_1.remap)(ratio, low, high);
    return {
        // remapped ratio
        norm: eyeOpenRatio,
        // ummapped ratio
        raw: ratio,
    };
};
exports.getEyeOpen = getEyeOpen;
/**
 * Calculate eyelid distance ratios based on landmarks on the face
 */
const eyeLidRatio = (eyeOuterCorner, eyeInnerCorner, eyeOuterUpperLid, eyeMidUpperLid, eyeInnerUpperLid, eyeOuterLowerLid, eyeMidLowerLid, eyeInnerLowerLid) => {
    eyeOuterCorner = new vector_1.default(eyeOuterCorner);
    eyeInnerCorner = new vector_1.default(eyeInnerCorner);
    eyeOuterUpperLid = new vector_1.default(eyeOuterUpperLid);
    eyeMidUpperLid = new vector_1.default(eyeMidUpperLid);
    eyeInnerUpperLid = new vector_1.default(eyeInnerUpperLid);
    eyeOuterLowerLid = new vector_1.default(eyeOuterLowerLid);
    eyeMidLowerLid = new vector_1.default(eyeMidLowerLid);
    eyeInnerLowerLid = new vector_1.default(eyeInnerLowerLid);
    //use 2D Distances instead of 3D for less jitter
    const eyeWidth = eyeOuterCorner.distance(eyeInnerCorner, 2);
    const eyeOuterLidDistance = eyeOuterUpperLid.distance(eyeOuterLowerLid, 2);
    const eyeMidLidDistance = eyeMidUpperLid.distance(eyeMidLowerLid, 2);
    const eyeInnerLidDistance = eyeInnerUpperLid.distance(eyeInnerLowerLid, 2);
    const eyeLidAvg = (eyeOuterLidDistance + eyeMidLidDistance + eyeInnerLidDistance) / 3;
    const ratio = eyeLidAvg / eyeWidth;
    return ratio;
};
exports.eyeLidRatio = eyeLidRatio;
/**
 * Calculate pupil position [-1,1]
 * @param {Results} lm : array of results from tfjs or mediapipe
 * @param {Side} side : left or right
 */
const pupilPos = (lm, side = constants_1.LEFT) => {
    const eyeOuterCorner = new vector_1.default(lm[points.eye[side][0]]);
    const eyeInnerCorner = new vector_1.default(lm[points.eye[side][1]]);
    const eyeWidth = eyeOuterCorner.distance(eyeInnerCorner, 2);
    const midPoint = eyeOuterCorner.lerp(eyeInnerCorner, 0.5);
    const pupil = new vector_1.default(lm[points.pupil[side][0]]);
    const dx = midPoint.x - pupil.x;
    //eye center y is slightly above midpoint
    const dy = midPoint.y - eyeWidth * 0.075 - pupil.y;
    let ratioX = dx / (eyeWidth / 2);
    let ratioY = dy / (eyeWidth / 4);
    ratioX *= 4;
    ratioY *= 4;
    return { x: ratioX, y: ratioY };
};
exports.pupilPos = pupilPos;
/**
 * Method to stabilize blink speeds to fix inconsistent eye open/close timing
 * @param {Object} eye : object with left and right eye values
 * @param {Number} headY : head y axis rotation in radians
 * @param {Object} options: Options for blink stabilization
 */
const stabilizeBlink = (eye, headY, { enableWink = true, maxRot = 0.5, } = {}) => {
    eye.r = (0, helpers_1.clamp)(eye.r, 0, 1);
    eye.l = (0, helpers_1.clamp)(eye.l, 0, 1);
    //difference between each eye
    const blinkDiff = Math.abs(eye.l - eye.r);
    //theshold to which difference is considered a wink
    const blinkThresh = enableWink ? 0.8 : 1.2;
    //detect when both eyes are closing
    const isClosing = eye.l < 0.3 && eye.r < 0.3;
    //detect when both eyes are opening
    const isOpen = eye.l > 0.6 && eye.r > 0.6;
    // sets obstructed eye to the opposite eye value
    if (headY > maxRot) {
        return { l: eye.r, r: eye.r };
    }
    if (headY < -maxRot) {
        return { l: eye.l, r: eye.l };
    }
    // returns either a wink or averaged blink values
    return {
        l: blinkDiff >= blinkThresh && !isClosing && !isOpen
            ? eye.l
            : eye.r > eye.l
                ? vector_1.default.lerp(eye.r, eye.l, 0.95)
                : vector_1.default.lerp(eye.r, eye.l, 0.05),
        r: blinkDiff >= blinkThresh && !isClosing && !isOpen
            ? eye.r
            : eye.r > eye.l
                ? vector_1.default.lerp(eye.r, eye.l, 0.95)
                : vector_1.default.lerp(eye.r, eye.l, 0.05),
    };
};
exports.stabilizeBlink = stabilizeBlink;
/**
 * Calculate Eyes
 * @param {Array} lm : array of results from tfjs or mediapipe
 */
const calcEyes = (lm, { high = 0.85, low = 0.55, } = {}) => {
    //return early if no iris tracking
    if (lm.length !== 478) {
        return {
            l: 1,
            r: 1,
        };
    }
    //open [0,1]
    const leftEyeLid = (0, exports.getEyeOpen)(lm, constants_1.LEFT, { high: high, low: low });
    const rightEyeLid = (0, exports.getEyeOpen)(lm, constants_1.RIGHT, { high: high, low: low });
    return {
        l: leftEyeLid.norm || 0,
        r: rightEyeLid.norm || 0,
    };
};
exports.calcEyes = calcEyes;
/**
 * Calculate pupil location normalized to eye bounds
 * @param {Array} lm : array of results from tfjs or mediapipe
 */
const calcPupils = (lm) => {
    //pupil x:[-1,1],y:[-1,1]
    if (lm.length !== 478) {
        return { x: 0, y: 0 };
    }
    else {
        //track pupils using left eye
        const pupilL = (0, exports.pupilPos)(lm, constants_1.LEFT);
        const pupilR = (0, exports.pupilPos)(lm, constants_1.RIGHT);
        return {
            x: (pupilL.x + pupilR.x) * 0.5 || 0,
            y: (pupilL.y + pupilR.y) * 0.5 || 0,
        };
    }
};
exports.calcPupils = calcPupils;
/**
 * Calculate brow raise
 * @param {Results} lm : array of results from tfjs or mediapipe
 * @param {Side} side : designate left or right
 */
const getBrowRaise = (lm, side = constants_1.LEFT) => {
    const browPoints = points.brow[side];
    const browDistance = (0, exports.eyeLidRatio)(lm[browPoints[0]], lm[browPoints[1]], lm[browPoints[2]], lm[browPoints[3]], lm[browPoints[4]], lm[browPoints[5]], lm[browPoints[6]], lm[browPoints[7]]);
    const maxBrowRatio = 1.15;
    const browHigh = 0.125;
    const browLow = 0.07;
    const browRatio = browDistance / maxBrowRatio - 1;
    const browRaiseRatio = ((0, helpers_1.clamp)(browRatio, browLow, browHigh) - browLow) / (browHigh - browLow);
    return browRaiseRatio;
};
exports.getBrowRaise = getBrowRaise;
/**
 * Take the average of left and right eyebrow raise values
 * @param {Array} lm : array of results from tfjs or mediapipe
 */
const calcBrow = (lm) => {
    if (lm.length !== 478) {
        return 0;
    }
    else {
        const leftBrow = (0, exports.getBrowRaise)(lm, constants_1.LEFT);
        const rightBrow = (0, exports.getBrowRaise)(lm, constants_1.RIGHT);
        return (leftBrow + rightBrow) / 2 || 0;
    }
};
exports.calcBrow = calcBrow;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaceSolver = void 0;
const calcHead_1 = require("./calcHead");
const calcEyes_1 = require("./calcEyes");
const calcMouth_1 = require("./calcMouth");
/** Class representing face solver. */
class FaceSolver {
    /** expose blink stabilizer as a static method */
    static stabilizeBlink = calcEyes_1.stabilizeBlink;
    /**
     * Combines head, eye, pupil, and eyebrow calcs into one method
     * @param {Results} lm : array of results from tfjs or mediapipe
     * @param {String} runtime: set as either "tfjs" or "mediapipe"
     * @param {IFaceSolveOptions} options: options for face solver
     */
    static solve(lm, { runtime = "tfjs", video = null, imageSize = null, smoothBlink = false, blinkSettings = [], } = {}) {
        if (!lm) {
            console.error("Need Face Landmarks");
            return;
        }
        // set image size based on video
        if (video) {
            const videoEl = (typeof video === "string" ? document.querySelector(video) : video);
            imageSize = {
                width: videoEl.videoWidth,
                height: videoEl.videoHeight,
            };
        }
        //if runtime is mediapipe, we need the image dimentions for accurate calculations
        if (runtime === "mediapipe" && imageSize) {
            for (const e of lm) {
                e.x *= imageSize.width;
                e.y *= imageSize.height;
                e.z *= imageSize.width;
            }
        }
        const getHead = (0, calcHead_1.calcHead)(lm);
        const getMouth = (0, calcMouth_1.calcMouth)(lm);
        //set high and low remapping values based on the runtime (tfjs vs mediapipe) of the results
        blinkSettings = blinkSettings.length > 0 ? blinkSettings : runtime === "tfjs" ? [0.55, 0.85] : [0.35, 0.5];
        let getEye = (0, calcEyes_1.calcEyes)(lm, {
            high: blinkSettings[1],
            low: blinkSettings[0],
        });
        // apply blink stabilizer if true
        if (smoothBlink) {
            getEye = (0, calcEyes_1.stabilizeBlink)(getEye, getHead.y);
        }
        const getPupils = (0, calcEyes_1.calcPupils)(lm);
        const getBrow = (0, calcEyes_1.calcBrow)(lm);
        return {
            head: getHead,
            eye: getEye,
            brow: getBrow,
            pupil: getPupils,
            mouth: getMouth,
        };
    }
}
exports.FaceSolver = FaceSolver;

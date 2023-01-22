"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Euler rotation class. */
class Euler {
    x;
    y;
    z;
    rotationOrder;
    constructor(a, b, c, rotationOrder) {
        if (!!a && typeof a === "object") {
            this.x = a.x ?? 0;
            this.y = a.y ?? 0;
            this.z = a.z ?? 0;
            this.rotationOrder = a.rotationOrder ?? "XYZ";
            return;
        }
        this.x = a ?? 0;
        this.y = b ?? 0;
        this.z = c ?? 0;
        this.rotationOrder = rotationOrder ?? "XYZ";
    }
    /**
     * Multiplies a number to an Euler.
     * @param {number} a: Number to multiply
     */
    multiply(v) {
        return new Euler(this.x * v, this.y * v, this.z * v, this.rotationOrder);
    }
}
exports.default = Euler;

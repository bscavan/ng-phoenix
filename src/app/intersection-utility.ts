import { GameObject } from "./game-board/game-object";
import { Point } from "./game-board/ship-piece";

export class AxisAlignedBoundingBox {
	public upperLeft: Point;
	public lowerRight: Point;

	constructor(upperLeft, lowerRight) {
		this.upperLeft = upperLeft;
		this.lowerRight = lowerRight;
	}
}

export class IntersectionUtility {
	/**
	 * Method that determines if two AxisAlignedBoundingBoxes intersect.
	 * If two piece's bounding boxes intersect then they might intersect and
	 * they need to be examined in more detail. However, this method can
	 * cheaply rule out many candidates, reducing the number of times we will
	 * need to use the more precise, and more expensive methods.
	 *
	 * @param a - An AxisAlignedBoundingBox for a Piece that might be
	 * intersecting with b.
	 * @param b - An AxisAlignedBoundingBox for a Piece that might be
	 * intersecting with a.
	 */
	public static doBoundingBoxesIntersect(a: AxisAlignedBoundingBox, b: AxisAlignedBoundingBox): boolean {
		// Distance between b's furthest-left and a's furthest-right
		let d1x: number = b.upperLeft.xCoordinate - a.lowerRight.xCoordinate;

		// Distance between b's furthest-north and a's furthest-south
		let d1y: number = b.upperLeft.yCoordinate - a.lowerRight.yCoordinate;

		// Distance between a's furthest-left and b's furthest-right
		let d2x: number = a.upperLeft.xCoordinate - b.lowerRight.xCoordinate;

		// Distance between a's furthest-north and b's furthest-south
		let d2y: number = a.upperLeft.yCoordinate - b.lowerRight.yCoordinate;

		// Testing our just barely touching here.
		if (d1x >= 0 || d1y >= 0
		|| d2x >= 0 || d2y >= 0) {
			return false;
		}

		return true;
	}

	public static doShapesIntersect(a: GameObject, b: GameObject): boolean {
		// TODO: Write this method;
		return true;
	}
}
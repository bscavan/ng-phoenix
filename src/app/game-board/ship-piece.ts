import { GameObject, Movement, SingleMoveGameObject } from './game-object';
// FIXME: Remove isNull and isUndefined...
import { isNull, isUndefined } from 'util';
import { AxisAlignedBoundingBox } from '../intersection-utility';

export class Point {
    xCoordinate: number;
    yCoordinate: number;

    constructor(xCoordinate: number, yCooridinate: number) {
        this.xCoordinate = xCoordinate;
        this.yCoordinate = yCooridinate;
    }
}
/**
 * FIXME: Split this up into separate files for each class.
 * I have a circular dependency here...
 */
export class Shape {
    // Note: the coordinates of these points are relative to the shape. They aren't absolute.
    exteriorCorners: Point[];
    color: string;
    outlineColor: string;

    constructor(exteriorCorners: Point[], color: string, outlineColor: string) {
        this.exteriorCorners = exteriorCorners;
        this.color = color;

        if(isNull(outlineColor) || isUndefined(outlineColor)) {
            this.outlineColor = color;
        } else {
            this.outlineColor = outlineColor;
        }
    }

    // TODO: Optimize this so it only gets re-generated after the list of shapes changes.
    generateBoundingBox(): AxisAlignedBoundingBox {
        let highestNorth = 0;
        let lowestSouth = 0;
        let currentPosition_Y = 0;

        let farthestEast = 0;
        let farthestWest = 0;
        let currentPosition_X = 0;

        this.exteriorCorners.forEach(currentCorner => {
            // On screens, a greater Y is lower down
            currentPosition_Y = currentCorner.yCoordinate;

            if(currentPosition_Y < highestNorth) {
                highestNorth = currentPosition_Y;
            }

            if(currentPosition_Y > lowestSouth) {
                lowestSouth = currentPosition_Y;
            }

            currentPosition_X = currentCorner.xCoordinate;

            if(currentPosition_X > farthestEast) {
                farthestEast = currentPosition_X;
            }

            if(currentPosition_X < farthestWest) {
                farthestWest = currentPosition_X;
            }
        });

        let min = new Point(farthestWest, highestNorth);
        let max = new Point(farthestEast, lowestSouth);

        return new AxisAlignedBoundingBox(min, max);
    }
}

export class ShipPiece extends SingleMoveGameObject {
    // FIXME: Shouldn't these values be parameters for the constructor?
    /**
     * The number of units of space this GameObject can move in one action.
     * // FIXME: This should probably instead be a measurent of distance per speed? I don't know yet.
     */
    baseMovementStep: number = 0;

    /**
     * The number seconds of in-game time it takes this GameObject to make one movement action.
     */
    baseMovementDuration: number = 0;
}

export class Highwind extends ShipPiece {
    public static readonly DEFAULT_COLOR: string = "blue";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "blue";

    constructor(upperLeftCorner: Point) {
        // Currently highwind is an equalateral triangle.
        let points: Point[] = [new Point(0, 1), new Point(1, 0), new Point(2, 1)];
        //let points: Point[] = [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(0, 0)];
        let shipShapes: Shape[] = [new Shape(points, Highwind.DEFAULT_COLOR, Highwind.DEFAULT_OUTLINE_COLOR)];

        super(upperLeftCorner, shipShapes, null);
        // Setting time and movement-determining values here.
        this.setTimeFactor(1);
        this.baseMovementStep = 1;
        this.baseMovementDuration = 1;
    }
}

export class SimpleBlockHead extends GameObject {
    public static readonly DEFAULT_COLOR: string = "red";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "red";

    constructor(upperLeftCorner: Point) {
        //let points: Point[] = [new Point(0, 1), new Point(1, 0), new Point(2, 1)];
        let points: Point[] = [new Point(0, 0), new Point(0, 1), new Point(1, 1), new Point(1, 0)];
        let shipShapes: Shape[] = [new Shape(points, SimpleBlockHead.DEFAULT_COLOR, SimpleBlockHead.DEFAULT_OUTLINE_COLOR)];
        let backAndForth: Movement[] = [new Movement(1, 0, 1), new Movement(1, 0, 1),
            new Movement(-1, 0, 1), new Movement(-1, 0, 1)];

        super(upperLeftCorner, shipShapes, backAndForth);
    }
}

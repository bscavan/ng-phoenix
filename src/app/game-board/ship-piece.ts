import { GameObject, Movement, SingleMoveGameObject } from './game-object';
import { isNull, isUndefined } from 'util';

export class Point {
    xCoordinate: number;
    yCoordinate: number;

    constructor(xCoordinate: number, yCooridinate: number) {
        this.xCoordinate = xCoordinate;
        this.yCoordinate = yCooridinate;
    }
}

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
}

export class ShipPiece extends SingleMoveGameObject {}

export class Highwind extends ShipPiece {
    public static readonly DEFAULT_COLOR: string = "blue";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "blue";

    constructor(upperLeftCorner: Point) {
        // Currently highwind is an equalateral triangle.
        let points: Point[] = [new Point(0, 1), new Point(1, 0), new Point(2, 1)];
        //let points: Point[] = [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(0, 0)];
        let shipShapes: Shape[] = [new Shape(points, Highwind.DEFAULT_COLOR, Highwind.DEFAULT_OUTLINE_COLOR)];

        super(upperLeftCorner, shipShapes, null);
    }
}

export class BlockHead extends GameObject {
    public static readonly DEFAULT_COLOR: string = "red";
    public static readonly DEFAULT_OUTLINE_COLOR: string = "red";

    constructor(upperLeftCorner: Point) {
        //let points: Point[] = [new Point(0, 1), new Point(1, 0), new Point(2, 1)];
        let points: Point[] = [new Point(0, 1), new Point(1, 1), new Point(1, 0), new Point(0, 0)];
        let shipShapes: Shape[] = [new Shape(points, BlockHead.DEFAULT_COLOR, BlockHead.DEFAULT_OUTLINE_COLOR)];
        let backAndForth: Movement[] = [new Movement(1, 0), new Movement(1, 0), new Movement(-1, 0), new Movement(-1, 0)];

        super(upperLeftCorner, shipShapes, backAndForth);
    }
}
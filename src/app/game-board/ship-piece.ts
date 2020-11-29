import { GameObject } from './game-object';

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

    constructor(exteriorCorners: Point[], color: string) {
        this.exteriorCorners = exteriorCorners;
        this.color = color;
    }
}

export class ShipPiece extends GameObject {}

export class Highwind extends ShipPiece {
    public static readonly DEFAULT_COLOR: string = "blue";

    constructor(upperLeftCorner: Point) {
        // Currently highwind is an equalateral triangle.
        let points: Point[] = [new Point(0, 1), new Point(1, 0), new Point(2, 1)];
        let shipShapes: Shape[] = [new Shape(points, Highwind.DEFAULT_COLOR)];

        super(upperLeftCorner, shipShapes);
    }
}
import { Point, Shape } from './ship-piece';

export class GameObject {
    upperLeftCorner: Point;
    shapes: Shape[];

    constructor(upperLeftCorner: Point, shapes: Shape[]) {
        this.upperLeftCorner = upperLeftCorner;
        this.shapes = shapes;
    }

    moveToPoint(point: Point) {
        this.moveToCoordinates(point.xCoordinate, point.yCoordinate);
    }

    moveToCoordinates(xCoordinate: number, yCoordinate: number) {
        this.upperLeftCorner.xCoordinate = xCoordinate;
        this.upperLeftCorner.yCoordinate = yCoordinate;
    }
}
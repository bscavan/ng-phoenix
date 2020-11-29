import { GameObject } from './game-object';
import { Shape, Point } from './ship-piece';

export class CustomCanvas {
    public static readonly DEFAULT_BACKGROUND_COLOR = "white";
    // TODO: Add a collection of all of the items on the game board here?
    // Give it a way of running a reverse-lookup for coordinates? To see what, if anything, exists at a point.
    underlyingCanvas: CanvasRenderingContext2D;
    backgroundColor: string = CustomCanvas.DEFAULT_BACKGROUND_COLOR;

    constructor(ctx: CanvasRenderingContext2D) {
        this.underlyingCanvas = ctx;
    }

    // TODO: Put more complex logic in here for special backgrounds...
    getBackgroundColor(): string {
        return this.backgroundColor;
    }

    getWidth(): number {
        return this.underlyingCanvas.canvas.width;
    }

    setWidth(newWidth: number): void {
        this.underlyingCanvas.canvas.width = newWidth;
    }

    getHeight(): number {
        return this.underlyingCanvas.canvas.height;
    }

    setHeight(newHeight: number): void {
        this.underlyingCanvas.canvas.height = newHeight;
    }

    scale(x, y): void {
        this.underlyingCanvas.scale(x, y);
    }

    draw(item: GameObject) {
        item.shapes.forEach((currentShape: Shape) => {
            if(currentShape.exteriorCorners.length > 0) {
                this.underlyingCanvas.fillStyle = currentShape.color;
                this.underlyingCanvas.beginPath();

                currentShape.exteriorCorners.forEach((currentPoint: Point) => {
                    // Remember, (0, 0) is the UPPER-left corner of the Canvas, not the LOWER-left.
                    let currentXCor: number = item.upperLeftCorner.xCoordinate + currentPoint.xCoordinate;
                    let currentYCor: number = item.upperLeftCorner.yCoordinate + currentPoint.yCoordinate;
                    
                    this.underlyingCanvas.lineTo(currentXCor, currentYCor);
                });

                this.underlyingCanvas.fill();
            }
        });
    }

    erase(item: GameObject) {
        item.shapes.forEach((currentShape: Shape) => {
            if(currentShape.exteriorCorners.length > 0) {
                this.underlyingCanvas.fillStyle = this.getBackgroundColor();
                this.underlyingCanvas.beginPath();

                currentShape.exteriorCorners.forEach((currentPoint: Point) => {
                    // Remember, (0, 0) is the UPPER-left corner of the Canvas, not the LOWER-left.
                    let currentXCor: number = item.upperLeftCorner.xCoordinate + currentPoint.xCoordinate;
                    let currentYCor: number = item.upperLeftCorner.yCoordinate + currentPoint.yCoordinate;
                    
                    this.underlyingCanvas.lineTo(currentXCor, currentYCor);
                });

                this.underlyingCanvas.fill();
            }
        });
    }
}
import { GameObject } from './game-object';
import { Shape, Point } from './ship-piece';

export class CustomCanvas {
    public static readonly DEFAULT_BACKGROUND_COLOR = "white";

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

    clearCanvas(): void {
        this.underlyingCanvas.clearRect(0, 0, this.underlyingCanvas.canvas.width, this.underlyingCanvas.canvas.height)
    }

    draw(item: GameObject) {
        item.shapes.forEach((currentShape: Shape) => {
            if(currentShape.exteriorCorners.length > 0) {
                this.underlyingCanvas.fillStyle = currentShape.color;
                this.underlyingCanvas.strokeStyle = currentShape.outlineColor;
                this.underlyingCanvas.beginPath();

                // We start at the first coordinate and then draw additional lines from there.
                let firstPoint = currentShape.exteriorCorners[0];
                this.underlyingCanvas.moveTo(item.upperLeftCorner.xCoordinate + firstPoint.xCoordinate,
                    item.upperLeftCorner.yCoordinate + firstPoint.yCoordinate);

                for(let index = 1; index < currentShape.exteriorCorners.length; index++) {
                    let currentPoint = currentShape.exteriorCorners[index];
                    let currentXCor: number = item.upperLeftCorner.xCoordinate + currentPoint.xCoordinate;
                    let currentYCor: number = item.upperLeftCorner.yCoordinate + currentPoint.yCoordinate;
                    
                    this.underlyingCanvas.lineTo(currentXCor, currentYCor);
                }

                this.underlyingCanvas.closePath();
                this.underlyingCanvas.fill();
            }
        });
    }

    erase(item: GameObject) {
        this.clearCanvas();

        item.shapes.forEach((currentShape: Shape) => {
            if(currentShape.exteriorCorners.length > 0) {
                /*
                 * TODO: In the future backgrounds may be customized to be multiple colors and/or patterns.
                 * At that point will it be necessary to rework this so that the new shape (the one taking
                 * the place of the object that we are now erasing) is split and handled as multiple parts
                 * for the coloring?
                 */
                this.underlyingCanvas.shadowBlur = 0;
                this.underlyingCanvas.globalAlpha = 1;
                this.underlyingCanvas.lineWidth = 1;
                this.underlyingCanvas.imageSmoothingEnabled = false;
                this.underlyingCanvas.fillStyle = this.getBackgroundColor();
                this.underlyingCanvas.strokeStyle = this.getBackgroundColor();
                this.underlyingCanvas.beginPath();

                // We start at the first coordinate and then draw additional lines from there.
                let firstPoint = currentShape.exteriorCorners[0];
                this.underlyingCanvas.moveTo(item.upperLeftCorner.xCoordinate + firstPoint.xCoordinate,
                    item.upperLeftCorner.yCoordinate + firstPoint.yCoordinate);

                for(let index = 1; index < currentShape.exteriorCorners.length; index++) {
                    let currentPoint = currentShape.exteriorCorners[index];
                    let currentXCor: number = item.upperLeftCorner.xCoordinate + currentPoint.xCoordinate;
                    let currentYCor: number = item.upperLeftCorner.yCoordinate + currentPoint.yCoordinate;
                    
                    this.underlyingCanvas.lineTo(currentXCor, currentYCor);
                }

                this.underlyingCanvas.closePath();
                this.underlyingCanvas.fill();
            }
        });
    }
}

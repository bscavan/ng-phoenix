import { GameObject } from './game-object';
import { Shape, Point } from './ship-piece';

export class CustomCanvas {
    public static readonly DEFAULT_BACKGROUND_COLOR = "white";

    /*
     * TODO: Refactor this to keep two canvases and swap between them.
     * Rather than painting the current canvas white and repainting it,
     * paint the canvas that isn't being shown, then swap them.
     */
    underlyingCanvas: CanvasRenderingContext2D;
    backgroundColor: string = CustomCanvas.DEFAULT_BACKGROUND_COLOR;

    /**
     * The length of the margin vertically above the canvas where
     * projectiles can exist within beyond what is shown on the canvas.
     * Anything further north than (0 - this value) is out of bounds and
     * will be removed.
     */
    northernMargin: number = 0;

    /**
     * The width of the margin horizontally to the right of the canvas where
     * projectiles can exist within beyond what is shown on the canvas.
     * Anything further east than (the canvas' width + this value) is out
     * of bounds and will be removed.
     */
     easternMargin: number = 0;

    /**
     * The length of the margin vertically below the canvas where
     * projectiles can exist within beyond what is shown on the canvas.
     * Anything further south than (the canvas' height + this value) is out
     * of bounds and will be removed.
     */
    southernMargin: number = 0;

    /**
     * The width of the margin horizontally to the left of the canvas where
     * projectiles can exist within beyond what is shown on the canvas.
     * Anything further west than (0 - this value) is out of bounds and
     * will be removed.
     */
     westernMargin: number = 0;

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

    public getNorthenBoundary() {
        return 0 - this.northernMargin;
    }

    public getEasternBoundary() {
        return this.getWidth() + this.easternMargin;
    }

    public getWesternBoundary() {
        return 0 - this.westernMargin;
    }

    public getSouthernBoundary() {
        return this.getHeight() + this.southernMargin;
    }

    clearCanvas(): void {
        this.underlyingCanvas.clearRect(0, 0, this.underlyingCanvas.canvas.width, this.underlyingCanvas.canvas.height)
    }

    draw(item: GameObject) {
        item.getShapes().forEach((currentShape: Shape) => {
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

        item.getShapes().forEach((currentShape: Shape) => {
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

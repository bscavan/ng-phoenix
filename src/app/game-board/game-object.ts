import { Point, Shape } from './ship-piece';

export class GameObject {
    upperLeftCorner: Point;
    shapes: Shape[];
    // TODO: Later add things like firing shots (either straight ahead, at static angles, or aimed towards the player)
    movementPattern: Movement[];
    lastMoveIndex: number = -1;
    nextMoveIndex: number = 0;

    constructor(upperLeftCorner: Point, shapes: Shape[], movementPattern: Movement[]) {
        this.upperLeftCorner = upperLeftCorner;
        this.shapes = shapes;
        this.movementPattern = movementPattern;
    }

    hasNextMove(): boolean {
        if(this.movementPattern.length < 0 || this.nextMoveIndex < 0) {
            return false;
        } else {
            return true;
        }
    }

    takeNextMove(): void {
        if(this.movementPattern.length < 0 || this.nextMoveIndex < 0) {
            // TODO: Throw or log an error here!
            return;
        } else {
            // If nextMoveIndex is greater than the length of the array, set it to the remainder.

            // If the nextMoveIndex refers to an item outside the bounds of the array, loop back around again.
            this.nextMoveIndex = this.nextMoveIndex % this.movementPattern.length;

            // Move the GameObject.
            this.moveGameObject(this.movementPattern[this.nextMoveIndex]);

            // Now that this move has been taken, increment the count so the next move will be taken on the next tick.
            this.nextMoveIndex++;
        }
    }

    moveToPoint(point: Point) {
        this.moveToCoordinates(point.xCoordinate, point.yCoordinate);
    }

    moveToCoordinates(xCoordinate: number, yCoordinate: number) {
        this.upperLeftCorner.xCoordinate = xCoordinate;
        this.upperLeftCorner.yCoordinate = yCoordinate;
    }

    moveGameObject(movement: Movement) {
        this.shiftPosition(movement.xMovement, movement.yMovement);
    }

    shiftPosition(xOffset: number, yOffset: number) {
        this.upperLeftCorner.xCoordinate = this.upperLeftCorner.xCoordinate + xOffset;
        this.upperLeftCorner.yCoordinate = this.upperLeftCorner.yCoordinate + yOffset;
    }
}

// Note, each movement is relative to the current position.
// Holding in position is accomplished with 0 movement and a duration.
export class Movement {
    // Measured in px, unless the canvas has been scaled up? (Well in that case we wouldn't care anyway, right?)
    xMovement: number;
    yMovement: number;
    // Measured in ticks of the game clock, not in seconds.
    // While higher-level classes may deal with real-time, this is a low-level operation.
    duration: number;

    constructor(xMovement: number, yMovement: number) {
        this.xMovement = xMovement;
        this.yMovement = yMovement;
        this.duration = 1;
    }

    // Duration is measured in ticks of the game clock, not in seconds.
    // If duration is greater than 1 movements are split across multiple
    // TODO: Ensure these values actually match up to the output. If they try to move 5px over 2 seconds, what do I do?
    static scriptMovement(xMovement: number, yMovement: number, duration: number): Movement[] {
        let output = [];

        if(duration <= 0 ) {
            return [];
            // TODO: Throw an error here!
        } else if(duration === 1) {
            output.push(new Movement(xMovement, yMovement));
            return output;
        }

        let xMovementPerStep = xMovement / duration;
        let yMovementPerStep = yMovement / duration;

        for(let counter = 0; counter < duration; counter++) {
            output.push(new Movement(xMovementPerStep, yMovementPerStep));
        }

        return output;
    }
}